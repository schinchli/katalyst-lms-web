/**
 * Phase D — Security Headers & OWASP Tests
 *
 * Validates all security headers (CSP, HSTS, X-Frame-Options, etc.),
 * API authentication enforcement, rate limit headers, and input validation.
 * Tests run against the live server — no credentials needed for most checks.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';

// ── HTTP Security Headers ──────────────────────────────────────────────────────

test.describe('Phase D — Security Headers', () => {
  test('X-Frame-Options is DENY', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    expect(res.headers()['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options is nosniff', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('Referrer-Policy is set', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const rp = res.headers()['referrer-policy'];
    expect(rp).toBeTruthy();
    expect(rp).toContain('strict-origin');
  });

  test('Strict-Transport-Security is set (HSTS)', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const hsts = res.headers()['strict-transport-security'];
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=');
  });

  test('Content-Security-Policy is present', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const csp = res.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('frame-ancestors');
  });

  test('CSP blocks framing (frame-ancestors none)', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const csp = res.headers()['content-security-policy'];
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('Permissions-Policy is set', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const pp = res.headers()['permissions-policy'];
    expect(pp).toBeTruthy();
    expect(pp).toContain('camera=()');
  });

  test('X-DNS-Prefetch-Control is on', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    const dns = res.headers()['x-dns-prefetch-control'];
    expect(dns).toBe('on');
  });

  test('X-Powered-By header is absent', async ({ request }) => {
    const res = await request.get(`${BASE}/login`);
    expect(res.headers()['x-powered-by']).toBeUndefined();
  });
});

// ── API Authentication Enforcement (OWASP A01 — Broken Access Control) ─────────

test.describe('Phase D — API Auth Enforcement', () => {
  test('GET /api/admin/check returns 401 without token', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/check`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/quiz-submit returns 400/401 without token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/quiz-submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: { quizId: 'clf-c02-billing', answers: {}, timeTaken: 60 },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('GET /api/coins returns 401 without token', async ({ request }) => {
    const res = await request.get(`${BASE}/api/coins`);
    expect([401, 403]).toContain(res.status());
  });

  test('POST /api/account/delete returns 401 without token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/account/delete`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /api/ads returns 401 without token', async ({ request }) => {
    const res = await request.get(`${BASE}/api/ads`);
    expect([401, 403]).toContain(res.status());
  });
});

// ── Intentionally Public API Routes ───────────────────────────────────────────

test.describe('Phase D — Public API Routes (by design)', () => {
  test('GET /api/platform-config returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/platform-config`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/quiz-catalog returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/quiz-catalog`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/system-features returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/system-features`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/contests returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/contests`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/app-content returns 200 without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/api/app-content`);
    expect(res.status()).toBe(200);
  });
});

// ── Input Validation (OWASP A03 — Injection) ─────────────────────────────────

test.describe('Phase D — Input Validation (Zod schemas)', () => {
  test('POST /api/sync-user rejects missing required fields (Zod 400)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/sync-user`, {
      headers: { 'Content-Type': 'application/json' },
      data: { unexpected: 'field' },
    });
    // Zod parse fails → 400 before any auth check
    expect(res.status()).toBe(400);
  });

  test('POST /api/quiz-submit rejects empty body (400)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/quiz-submit`, {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect([400, 401]).toContain(res.status());
  });

  test('POST /api/admin/mobile-config rejects unknown fields (Zod strict)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/admin/mobile-config`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token',
      },
      data: {
        unknownField: 'injected',
        __proto__: { polluted: true },
        constructor: { prototype: {} },
      },
    });
    // 401 (bad token) or 400 (Zod reject unknown) — both acceptable; must NOT be 200
    expect(res.status()).not.toBe(200);
    expect(res.status()).not.toBe(500);
  });

  test('POST /api/payment/razorpay-verify rejects malformed body (400)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/payment/razorpay-verify`, {
      headers: { 'Content-Type': 'application/json' },
      data: { notAValidField: 'xss<script>alert(1)</script>' },
    });
    expect([400, 401, 403]).toContain(res.status());
  });

  test('login page does not reflect XSS in URL params', async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=<script>alert(1)</script>`);
    const alerts: string[] = [];
    page.on('dialog', (d) => { alerts.push(d.message()); d.dismiss(); });
    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  });
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────

test.describe('Phase D — Rate Limiting', () => {
  test('API returns Retry-After header on 429', async ({ request }) => {
    // Send many rapid requests to trigger rate limit on public endpoint
    // Use a low-limit endpoint — /api/recaptcha/verify is 10/min
    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post(`${BASE}/api/recaptcha/verify`, {
          headers: { 'Content-Type': 'application/json' },
          data: { token: 'fake-token' },
        }),
      ),
    );
    const rateLimited = responses.filter((r) => r.status() === 429);
    if (rateLimited.length > 0) {
      const retryAfter = rateLimited[0]!.headers()['retry-after'];
      expect(retryAfter).toBeTruthy();
    }
    // At minimum, server should not error (5xx) on repeated requests
    const serverErrors = responses.filter((r) => r.status() >= 500);
    expect(serverErrors).toHaveLength(0);
  });
});

// ── Auth Redirect (OWASP A01) ────────────────────────────────────────────────

test.describe('Phase D — Auth Redirect Guards', () => {
  const protectedPaths = [
    '/dashboard',
    '/dashboard/profile',
    '/dashboard/quizzes',
    '/dashboard/settings',
    '/dashboard/admin',
    '/dashboard/leaderboard',
    '/dashboard/progress',
  ];

  for (const path of protectedPaths) {
    test(`unauthenticated ${path} redirects to /login`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/login');
    });
  }
});
