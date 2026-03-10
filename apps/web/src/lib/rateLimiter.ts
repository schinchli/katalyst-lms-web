/**
 * rateLimiter.ts — Rate limiter for Next.js API routes.
 * Uses Upstash Redis when configured, falls back to in-memory store.
 */

interface RateLimitEntry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const UPSTASH_URL   = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_UPSTASH   = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Evict expired entries every 5 minutes to prevent memory leaks (local mode)
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
  if (typeof (timer as NodeJS.Timeout).unref === 'function') (timer as NodeJS.Timeout).unref();
}

function checkRateLimitLocal(key: string, limit: number, windowMs: number): boolean {
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

async function checkRateLimitUpstash(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return checkRateLimitLocal(key, limit, windowMs);
  const url = `${UPSTASH_URL.replace(/\/$/, '')}/pipeline`;
  const body = JSON.stringify([
    ['INCR', `rl:${key}`],
    ['PTTL', `rl:${key}`],
    ['PEXPIRE', `rl:${key}`, windowMs, 'NX'],
  ]);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}`, 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) throw new Error(`Upstash rate limit failed ${res.status}`);
  const payload = await res.json() as Array<{ result?: unknown }>;
  const count = Number(payload?.[0]?.result ?? 0);
  return count <= limit;
}

export async function checkRateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): Promise<boolean> {
  if (!USE_UPSTASH) return checkRateLimitLocal(key, limit, windowMs);
  try {
    return await checkRateLimitUpstash(key, limit, windowMs);
  } catch {
    return checkRateLimitLocal(key, limit, windowMs);
  }
}

// For local tests only (Upstash path not reflected here)
export function getRemainingRequests(key: string, limit: number): number {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.resetAt) return limit;
  return Math.max(0, limit - entry.count);
}
