/**
 * Tests for the in-memory rate limiter.
 * Covers OWASP A04 / MITRE T1499 protections.
 */

import { checkRateLimit, getRemainingRequests } from '@/lib/rateLimiter';

describe('checkRateLimit', () => {
  const KEY    = `test-key-${Date.now()}`;
  const LIMIT  = 3;
  const WINDOW = 60_000; // 1 minute

  it('allows requests under the limit', async () => {
    const k = `${KEY}-allow`;
    await expect(checkRateLimit(k, LIMIT, WINDOW)).resolves.toBe(true);
    await expect(checkRateLimit(k, LIMIT, WINDOW)).resolves.toBe(true);
    await expect(checkRateLimit(k, LIMIT, WINDOW)).resolves.toBe(true);
  });

  it('blocks the (limit+1)th request', async () => {
    const k = `${KEY}-block`;
    for (let i = 0; i < LIMIT; i++) await checkRateLimit(k, LIMIT, WINDOW);
    await expect(checkRateLimit(k, LIMIT, WINDOW)).resolves.toBe(false);
  });

  it('allows a new request after the window resets', async () => {
    const k = `${KEY}-reset`;
    // Fill up the window
    for (let i = 0; i < LIMIT; i++) await checkRateLimit(k, LIMIT, WINDOW);
    await expect(checkRateLimit(k, LIMIT, WINDOW)).resolves.toBe(false);

    // Use a 1ms window so it expires immediately
    const k2 = `${KEY}-reset2`;
    await checkRateLimit(k2, 1, 1); // fill
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        checkRateLimit(k2, 1, 1).then((allowed) => {
          expect(allowed).toBe(true); // should be reset
          resolve();
        });
      }, 5);
    });
  });

  it('treats different keys independently', async () => {
    const k1 = `${KEY}-k1`;
    const k2 = `${KEY}-k2`;
    for (let i = 0; i < LIMIT; i++) await checkRateLimit(k1, LIMIT, WINDOW);
    await expect(checkRateLimit(k1, LIMIT, WINDOW)).resolves.toBe(false);
    await expect(checkRateLimit(k2, LIMIT, WINDOW)).resolves.toBe(true); // unrelated key still passes
  });

  it('allows limit=1 for single-use keys', async () => {
    const k = `${KEY}-single`;
    await expect(checkRateLimit(k, 1, WINDOW)).resolves.toBe(true);
    await expect(checkRateLimit(k, 1, WINDOW)).resolves.toBe(false);
  });
});

describe('getRemainingRequests', () => {
  it('returns limit when key has not been used', () => {
    const k = `remaining-${Date.now()}`;
    expect(getRemainingRequests(k, 5)).toBe(5);
  });

  it('decrements correctly after requests', async () => {
    const k = `remaining-dec-${Date.now()}`;
    await checkRateLimit(k, 5, 60_000);
    await checkRateLimit(k, 5, 60_000);
    expect(getRemainingRequests(k, 5)).toBe(3);
  });

  it('returns 0 when limit is exhausted', async () => {
    const k = `remaining-zero-${Date.now()}`;
    for (let i = 0; i < 5; i++) await checkRateLimit(k, 5, 60_000);
    await checkRateLimit(k, 5, 60_000); // one more past limit
    expect(getRemainingRequests(k, 5)).toBe(0);
  });
});
