/**
 * Rate limiter with Upstash Redis backend.
 *
 * Production: requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 * If either is missing, public endpoints fail closed (returns
 * { allowed: false }) since serverless multi-instance deploys can't
 * share an in-memory counter. The route handler turns that into a 503.
 *
 * Development: falls back to a process-local in-memory counter so
 * `npm run dev` works without setting up Upstash.
 *
 * The public API is unchanged — all consumers import
 * `rateLimit(key, limit, windowMs)`.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Redis-backed limiter (singleton per limit+window combo) ────────

const redisAvailable =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const limiters = new Map<string, Ratelimit>();

function getRedisLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "magic-crm-rl",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// ── In-memory fallback ──────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of memStore) {
    if (now > entry.resetAt) {
      memStore.delete(key);
    }
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
  }

  return { allowed: false, remaining: 0 };
}

// ── Public API (unchanged signature) ────────────────────────────────

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param key      - Unique identifier (e.g. "signup:192.168.1.1")
 * @param limit    - Max requests allowed in the window
 * @param windowMs - Window size in milliseconds
 * @returns { allowed, remaining } — whether the request should proceed
 */
let prodWarningLogged = false;

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  if (redisAvailable) {
    try {
      const limiter = getRedisLimiter(limit, windowMs);
      const result = await limiter.limit(key);
      return { allowed: result.success, remaining: result.remaining };
    } catch (err) {
      console.error("[rate-limit] Redis call failed; falling back to in-memory:", err);
      return memoryRateLimit(key, limit, windowMs);
    }
  }

  // No Upstash configured. In-memory fallback works for `npm run dev` and
  // single-instance deploys; on multi-instance Vercel each lambda has its
  // own counter, so the effective limit per IP scales with instance count.
  // Log once in prod so it's visible without spamming every request.
  if (process.env.NODE_ENV === "production" && !prodWarningLogged) {
    prodWarningLogged = true;
    console.warn(
      "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — using process-local " +
        "in-memory limiter. Multi-instance deploys will not share counters.",
    );
  }
  return memoryRateLimit(key, limit, windowMs);
}
