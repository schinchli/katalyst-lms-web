/**
 * rateLimiter.ts — Simple in-memory rate limiter for Next.js API routes.
 *
 * OWASP A04 (Insecure Design) / MITRE ATT&CK T1499 (Endpoint DoS) mitigation.
 *
 * Not distributed — does not work across multiple server instances.
 * For production multi-instance deployments, swap the store for Redis.
 */

interface RateLimitEntry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Evict expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key       Unique identifier (e.g. IP address or userId)
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): boolean {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

/**
 * Returns the number of remaining requests in the current window.
 */
export function getRemainingRequests(
  key:      string,
  limit:    number,
): number {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.resetAt) return limit;
  return Math.max(0, limit - entry.count);
}
