/**
 * resolveDailyQuiz (deterministic daily rotation + admin pin) and the
 * rateLimiter's Upstash path with in-memory fallback — both are
 * production-gate logic used by every API route / the daily quiz feature.
 */
import { resolveDailyQuiz, normalizeSystemFeatures, DEFAULT_SYSTEM_FEATURES } from '@/lib/systemFeatures';

const QUIZZES = [
  { id: 'q-free-1', isPremium: false },
  { id: 'q-free-2', isPremium: false },
  { id: 'q-prem', isPremium: true },
  { id: 'q-hidden', isPremium: false, enabled: false },
];

const cfg = (over: Partial<typeof DEFAULT_SYSTEM_FEATURES>) =>
  ({ ...DEFAULT_SYSTEM_FEATURES, ...over });

describe('resolveDailyQuiz', () => {
  it('returns null when the feature is off or the pool is empty', () => {
    expect(resolveDailyQuiz(cfg({ dailyQuizEnabled: false }), QUIZZES)).toBeNull();
    expect(resolveDailyQuiz(cfg({ dailyQuizEnabled: true }), [])).toBeNull();
  });

  it('honours the admin-pinned quiz id when visible', () => {
    const out = resolveDailyQuiz(cfg({ dailyQuizEnabled: true, dailyQuizQuizId: 'q-free-2' }), QUIZZES);
    expect(out?.id).toBe('q-free-2');
  });

  it('ignores a pinned id pointing at a disabled quiz and rotates instead', () => {
    const out = resolveDailyQuiz(cfg({ dailyQuizEnabled: true, dailyQuizQuizId: 'q-hidden' }), QUIZZES);
    expect(out).not.toBeNull();
    expect(out?.id).not.toBe('q-hidden');
  });

  it('rotation excludes premium + disabled quizzes and is deterministic per UTC day', () => {
    const day = new Date('2026-07-03T10:00:00Z');
    const a = resolveDailyQuiz(cfg({ dailyQuizEnabled: true }), QUIZZES, day);
    const b = resolveDailyQuiz(cfg({ dailyQuizEnabled: true }), QUIZZES, new Date('2026-07-03T23:59:00Z'));
    expect(a?.id).toBe(b?.id); // same UTC day → same quiz
    expect(['q-free-1', 'q-free-2']).toContain(a?.id);
    const nextDay = resolveDailyQuiz(cfg({ dailyQuizEnabled: true }), QUIZZES, new Date('2026-07-04T10:00:00Z'));
    expect(nextDay?.id).not.toBe(a?.id); // 2 free quizzes → alternates daily
  });

  it('falls back to the full visible pool when everything is premium', () => {
    const allPrem = [{ id: 'p1', isPremium: true }, { id: 'p2', isPremium: true }];
    const out = resolveDailyQuiz(cfg({ dailyQuizEnabled: true }), allPrem);
    expect(['p1', 'p2']).toContain(out?.id);
  });
});

describe('normalizeSystemFeatures — field-level typing', () => {
  it('rejects wrong-typed fields and blank strings', () => {
    const out = normalizeSystemFeatures({
      maintenanceMode: 'yes',       // wrong type → default
      maintenanceMessage: '   ',    // blank → default
      minimumAppVersion: '2.0.0',   // valid
      adsEnabled: false,            // valid
    });
    expect(out.maintenanceMode).toBe(DEFAULT_SYSTEM_FEATURES.maintenanceMode);
    expect(out.maintenanceMessage).toBe(DEFAULT_SYSTEM_FEATURES.maintenanceMessage);
    expect(out.minimumAppVersion).toBe('2.0.0');
    expect(out.adsEnabled).toBe(false);
  });
});

describe('rateLimiter — Upstash path with fallback', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  async function loadWithUpstash() {
    process.env.UPSTASH_REDIS_REST_URL = 'https://fake.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    jest.resetModules();
    return import('@/lib/rateLimiter');
  }

  it('allows under the limit via Upstash INCR count', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: async () => [{ result: 3 }, { result: 60000 }, { result: 1 }],
    }) as unknown as typeof fetch;
    const { checkRateLimit } = await loadWithUpstash();
    expect(await checkRateLimit('k', 5, 60_000)).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://fake.upstash.io/pipeline',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token' }) }),
    );
  });

  it('blocks over the limit via Upstash INCR count', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, json: async () => [{ result: 6 }, { result: 60000 }, { result: 0 }],
    }) as unknown as typeof fetch;
    const { checkRateLimit } = await loadWithUpstash();
    expect(await checkRateLimit('k', 5, 60_000)).toBe(false);
  });

  it('falls back to the in-memory limiter when Upstash errors (fail-open per process)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    const { checkRateLimit } = await loadWithUpstash();
    // local fallback: first two allowed, third (limit 2) blocked
    expect(await checkRateLimit('fb', 2, 60_000)).toBe(true);
    expect(await checkRateLimit('fb', 2, 60_000)).toBe(true);
    expect(await checkRateLimit('fb', 2, 60_000)).toBe(false);
  });

  it('checkRateLimitWithReset reports seconds until the window resets', async () => {
    jest.resetModules();
    const { checkRateLimitWithReset } = await import('@/lib/rateLimiter');
    const first = await checkRateLimitWithReset('reset-key', 1, 30_000);
    expect(first.allowed).toBe(true);
    const second = await checkRateLimitWithReset('reset-key', 1, 30_000);
    expect(second.allowed).toBe(false);
    expect(second.resetAfterSec).toBeGreaterThan(0);
    expect(second.resetAfterSec).toBeLessThanOrEqual(30);
  });

  it('getRemainingRequests counts down and resets after the window', async () => {
    jest.resetModules();
    const { checkRateLimit, getRemainingRequests } = await import('@/lib/rateLimiter');
    await checkRateLimit('rem', 3, 60_000);
    expect(getRemainingRequests('rem', 3)).toBe(2);
    expect(getRemainingRequests('never-used', 3)).toBe(3);
  });
});
