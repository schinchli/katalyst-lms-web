/**
 * Tests for the in-memory rate limiter.
 * Covers OWASP A04 / MITRE T1499 protections.
 */

import { checkRateLimit, getRemainingRequests } from '@/lib/rateLimiter';

describe('checkRateLimit', () => {
  const KEY    = `test-key-${Date.now()}`;
  const LIMIT  = 3;
  const WINDOW = 60_000; // 1 minute

  it('allows requests under the limit', () => {
    const k = `${KEY}-allow`;
    expect(checkRateLimit(k, LIMIT, WINDOW)).toBe(true);
    expect(checkRateLimit(k, LIMIT, WINDOW)).toBe(true);
    expect(checkRateLimit(k, LIMIT, WINDOW)).toBe(true);
  });

  it('blocks the (limit+1)th request', () => {
    const k = `${KEY}-block`;
    for (let i = 0; i < LIMIT; i++) checkRateLimit(k, LIMIT, WINDOW);
    expect(checkRateLimit(k, LIMIT, WINDOW)).toBe(false);
  });

  it('allows a new request after the window resets', () => {
    const k = `${KEY}-reset`;
    // Fill up the window
    for (let i = 0; i < LIMIT; i++) checkRateLimit(k, LIMIT, WINDOW);
    expect(checkRateLimit(k, LIMIT, WINDOW)).toBe(false);

    // Use a 1ms window so it expires immediately
    const k2 = `${KEY}-reset2`;
    checkRateLimit(k2, 1, 1); // fill
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(checkRateLimit(k2, 1, 1)).toBe(true); // should be reset
        resolve();
      }, 5);
    });
  });

  it('treats different keys independently', () => {
    const k1 = `${KEY}-k1`;
    const k2 = `${KEY}-k2`;
    for (let i = 0; i < LIMIT; i++) checkRateLimit(k1, LIMIT, WINDOW);
    expect(checkRateLimit(k1, LIMIT, WINDOW)).toBe(false);
    expect(checkRateLimit(k2, LIMIT, WINDOW)).toBe(true); // unrelated key still passes
  });

  it('allows limit=1 for single-use keys', () => {
    const k = `${KEY}-single`;
    expect(checkRateLimit(k, 1, WINDOW)).toBe(true);
    expect(checkRateLimit(k, 1, WINDOW)).toBe(false);
  });
});

describe('getRemainingRequests', () => {
  it('returns limit when key has not been used', () => {
    const k = `remaining-${Date.now()}`;
    expect(getRemainingRequests(k, 5)).toBe(5);
  });

  it('decrements correctly after requests', () => {
    const k = `remaining-dec-${Date.now()}`;
    checkRateLimit(k, 5, 60_000);
    checkRateLimit(k, 5, 60_000);
    expect(getRemainingRequests(k, 5)).toBe(3);
  });

  it('returns 0 when limit is exhausted', () => {
    const k = `remaining-zero-${Date.now()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(k, 5, 60_000);
    checkRateLimit(k, 5, 60_000); // one more past limit
    expect(getRemainingRequests(k, 5)).toBe(0);
  });
});
