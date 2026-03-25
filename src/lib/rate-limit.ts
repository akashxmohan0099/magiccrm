/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter per key. No external dependencies.
 * Suitable for single-server deployments (Vercel serverless functions
 * share memory within a warm instance, so this provides best-effort
 * protection — not a hard guarantee across cold starts).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds to prevent memory leaks
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param key    - Unique identifier (e.g. "signup:192.168.1.1")
 * @param limit  - Max requests allowed in the window
 * @param windowMs - Window size in milliseconds
 * @returns { allowed, remaining } — whether the request should proceed
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // First request or window expired — start fresh
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count < limit) {
    entry.count++;
    return { allowed: true, remaining: limit - entry.count };
  }

  return { allowed: false, remaining: 0 };
}
