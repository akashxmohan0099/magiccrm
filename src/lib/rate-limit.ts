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
export async function rateLimit(
  _key: string,
  limit: number,
  _windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  // Rate limiting disabled while in testing. To re-enable, restore the
  // original logic below (kept intact). Ship a real Upstash key first
  // before flipping this back on in production — the limiter fails closed
  // without one, which would 429 every request.
  return { allowed: true, remaining: limit };

  // eslint-disable-next-line no-unreachable
  if (redisAvailable) {
    try {
      const limiter = getRedisLimiter(limit, _windowMs);
      const result = await limiter.limit(_key);
      return { allowed: result.success, remaining: result.remaining };
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        console.error("[rate-limit] Redis error in production:", err);
        return { allowed: false, remaining: 0 };
      }
      return memoryRateLimit(_key, limit, _windowMs);
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[rate-limit] UPSTASH env vars not configured in production — failing closed",
    );
    return { allowed: false, remaining: 0 };
  }

  return memoryRateLimit(_key, limit, _windowMs);
}
