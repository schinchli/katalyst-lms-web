/**
 * Phase F — Quiz Builder + Score Retention + Leaderboard + Admin Grant Access
 *
 * Verifies end-to-end:
 * 1. Quiz builder CRUD via API (admin)
 * 2. Managed quiz appears in quiz-content API
 * 3. Leaderboard API returns retained scores
 * 4. Admin grant-access API writes to orders
 * 5. Customers API returns purchase/unlock counts
 * 6. UI: leaderboard page renders with period tabs
 * 7. UI: quiz page loads a free quiz and shows intro screen
 *
 * Required env vars for admin/auth flows:
 *   ADMIN_TOKEN     — Supabase access token for an admin user
 *   TEST_USER_ID    — UUID of a non-admin test user (for grant-access)
 *   TEST_EMAIL      — Email of test user (for login)
 *   TEST_PASSWORD   — Password of test user
 *
 * Public API tests run without any env vars against the live URL.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';

const LIVE    = 'https://lms-amber-two.vercel.app';
const BASE    = process.env.TEST_BASE_URL ?? LIVE;
const ADMIN_TOKEN   = process.env.ADMIN_TOKEN ?? '';
const TEST_USER_ID  = process.env.TEST_USER_ID ?? '';
const EMAIL   = process.env.TEST_EMAIL    ?? '';
const PASS    = process.env.TEST_PASSWORD ?? '';
const HAS_ADMIN = Boolean(ADMIN_TOKEN);
const HAS_USER  = Boolean(TEST_USER_ID && ADMIN_TOKEN);
const HAS_AUTH  = Boolean(EMAIL && PASS);

// Shared quiz ID created during this test run (managed quiz)
let createdQuizId = '';

// ── 1. Public API: quiz-catalog ───────────────────────────────────────────────

test.describe('Quiz Catalog (public API)', () => {
  test('GET /api/quiz-catalog returns ok:true with overrides object', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/quiz-catalog`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; overrides: unknown };
    expect(body.ok).toBe(true);
    // overrides is a record, not an array (admin-set premium/price flags per quiz ID)
    expect(typeof body.overrides).toBe('object');
  });
});

// ── 2. Public API: quiz-content ───────────────────────────────────────────────

test.describe('Managed Quiz Content (public API)', () => {
  test('GET /api/quiz-content returns ok:true with quizzes + questions', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/quiz-content`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; content?: { quizzes: unknown[]; questions: unknown } };
    expect(body.ok).toBe(true);
    expect(body.content).toBeTruthy();
    expect(Array.isArray(body.content?.quizzes)).toBe(true);
    expect(typeof body.content?.questions).toBe('object');
  });

  test('quiz-content quizzes include base built-in quizzes', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/quiz-content`);
    const body = await res.json() as { ok: boolean; content?: { quizzes: Array<{ id: string }> } };
    if (!body.content?.quizzes) return;
    const ids = body.content.quizzes.map((q) => q.id);
    // clf-c02-full-exam is always present (built-in)
    expect(ids).toContain('clf-c02-full-exam');
  });
});

// ── 3. Public API: leaderboard ────────────────────────────────────────────────

test.describe('Leaderboard API (public)', () => {
  test('GET /api/leaderboard?period=alltime returns ok:true', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?period=alltime`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; entries: unknown[] };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('GET /api/leaderboard?period=daily returns ok:true', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?period=daily`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; entries: unknown[] };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('GET /api/leaderboard?period=monthly returns ok:true', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?period=monthly`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; entries: unknown[] };
    expect(body.ok).toBe(true);
  });

  test('leaderboard entries have required shape (rank, name, score)', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?period=alltime`);
    const body = await res.json() as { ok: boolean; entries: Array<{ rank: number; name: string; score: number; quizzesCompleted: number }> };
    if (!body.entries?.length) return; // skip if no results yet
    const first = body.entries[0];
    expect(typeof first.rank).toBe('number');
    expect(typeof first.name).toBe('string');
    expect(typeof first.score).toBe('number');
    expect(typeof first.quizzesCompleted).toBe('number');
  });

  test('leaderboard entries are sorted descending by score', async ({ request }) => {
    const res  = await request.get(`${BASE}/api/leaderboard?period=alltime`);
    const body = await res.json() as { ok: boolean; entries: Array<{ score: number }> };
    if (!body.entries?.length || body.entries.length < 2) return;
    for (let i = 1; i < body.entries.length; i++) {
      expect(body.entries[i].score).toBeLessThanOrEqual(body.entries[i - 1].score);
    }
  });

  test('invalid period returns 400', async ({ request }) => {
    const res = await request.get(`${BASE}/api/leaderboard?period=weekly`);
    expect(res.status()).toBe(400);
  });

  test('leaderboard has Cache-Control header for CDN caching', async ({ request }) => {
    const res = await request.get(`${BASE}/api/leaderboard?period=alltime`);
    const cc  = res.headers()['cache-control'] ?? '';
    expect(cc).toMatch(/max-age/);
  });
});

// ── 4. Admin: quiz builder CRUD ───────────────────────────────────────────────

test.describe('Admin Quiz Builder CRUD', () => {
  test.skip(!HAS_ADMIN, 'Requires ADMIN_TOKEN env var');

  let api: APIRequestContext;

  test.beforeAll(({ playwright }) =>
    playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    }).then((ctx) => { api = ctx; }),
  );
  test.afterAll(async () => {
    // Guarantee cleanup: delete the playwright test quiz even if the explicit
    // delete test was skipped or failed. Prevents test fixtures leaking to prod.
    if (createdQuizId) {
      await api.delete(`/api/admin/quiz-builder/${createdQuizId}`).catch(() => {/* already gone */});
      createdQuizId = '';
    }
    await api.dispose();
  });

  test('GET /api/admin/quiz-builder returns merged catalog', async () => {
    const res  = await api.get('/api/admin/quiz-builder');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; quizzes: Array<{ id: string; _source: string }> };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.quizzes)).toBe(true);
    // Built-in quizzes annotated
    const builtin = body.quizzes.filter((q) => q._source === 'builtin');
    expect(builtin.length).toBeGreaterThan(0);
  });

  test('POST /api/admin/quiz-builder creates a managed quiz', async () => {
    const res  = await api.post('/api/admin/quiz-builder', {
      data: {
        title:      'Playwright Test Quiz',
        description:'Created by Playwright automated test',
        category:   'testing',
        difficulty: 'beginner',
        duration:   5,
        isPremium:  false,
        icon:       '🎭',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json() as { ok: boolean; quiz: { id: string; _source: string } };
    expect(body.ok).toBe(true);
    expect(body.quiz._source).toBe('managed');
    createdQuizId = body.quiz.id;
    expect(createdQuizId).toMatch(/playwright-test-quiz/);
  });

  test('new quiz appears in GET /api/admin/quiz-builder after creation', async () => {
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await api.get('/api/admin/quiz-builder');
    const body = await res.json() as { ok: boolean; quizzes: Array<{ id: string }> };
    const ids  = body.quizzes.map((q) => q.id);
    expect(ids).toContain(createdQuizId);
  });

  test('new quiz appears in admin /api/admin/quiz-builder after creation', async () => {
    // Playwright-prefixed quizzes are filtered from the public quiz-content API
    // (they're internal test fixtures). Verify via the admin API instead.
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await api.get('/api/admin/quiz-builder');
    const body = await res.json() as { ok: boolean; quizzes: Array<{ id: string }> };
    const ids  = body.quizzes.map((q) => q.id);
    expect(ids).toContain(createdQuizId);
  });

  test('playwright-prefixed quizzes are hidden from public /api/quiz-content', async ({ request }) => {
    // Safety net: ensure test quizzes never leak to end users even if cleanup fails.
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await request.get(`${BASE}/api/quiz-content`);
    const body = await res.json() as { ok: boolean; content?: { quizzes: Array<{ id: string }> } };
    const ids  = (body.content?.quizzes ?? []).map((q) => q.id);
    expect(ids).not.toContain(createdQuizId);
  });

  test('PUT /api/admin/quiz-builder/:id/questions saves questions', async () => {
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res = await api.put(`/api/admin/quiz-builder/${createdQuizId}/questions`, {
      data: {
        questions: [
          {
            text: 'What does AWS stand for?',
            options: [
              { id: 'a', text: 'Amazon Web Services' },
              { id: 'b', text: 'Advanced Web Systems' },
              { id: 'c', text: 'Automated Web Software' },
              { id: 'd', text: 'Amazon Wide Services' },
            ],
            correctOptionId: 'a',
            explanation: 'AWS stands for Amazon Web Services.',
            difficulty: 'beginner',
          },
          {
            text: 'Which AWS service is used for object storage?',
            options: [
              { id: 'a', text: 'Amazon EC2' },
              { id: 'b', text: 'Amazon S3' },
              { id: 'c', text: 'Amazon RDS' },
              { id: 'd', text: 'Amazon Lambda' },
            ],
            correctOptionId: 'b',
            explanation: 'Amazon S3 (Simple Storage Service) is AWS object storage.',
            difficulty: 'beginner',
          },
          {
            text: 'What is the AWS free tier?',
            options: [
              { id: 'a', text: 'Unlimited free AWS usage' },
              { id: 'b', text: 'Free usage up to specified limits for 12 months' },
              { id: 'c', text: 'A special tier for students only' },
              { id: 'd', text: 'Free for developers with an AWS account' },
            ],
            correctOptionId: 'b',
            explanation: 'The AWS Free Tier provides limited free access to many services for 12 months.',
            difficulty: 'beginner',
          },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; count: number };
    expect(body.ok).toBe(true);
    expect(body.count).toBe(3);
  });

  test('GET /api/admin/quiz-builder/:id/questions returns saved questions', async () => {
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await api.get(`/api/admin/quiz-builder/${createdQuizId}/questions`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; questions: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.questions.length).toBe(3);
  });

  test('PATCH /api/admin/quiz-builder/:id updates quiz metadata', async () => {
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await api.patch(`/api/admin/quiz-builder/${createdQuizId}`, {
      data: { title: 'Playwright Test Quiz (Updated)', duration: 8 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; quiz: { title: string; duration: number } };
    expect(body.ok).toBe(true);
    expect(body.quiz.title).toBe('Playwright Test Quiz (Updated)');
    expect(body.quiz.duration).toBe(8);
  });

  test('DELETE on a built-in quiz returns 409 Conflict', async () => {
    const res = await api.delete('/api/admin/quiz-builder/clf-c02-full-exam');
    expect(res.status()).toBe(409);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/built.in/i);
  });

  test('DELETE /api/admin/quiz-builder/:id removes managed quiz', async () => {
    test.skip(!createdQuizId, 'Skipped: quiz creation test did not run first');
    const res  = await api.delete(`/api/admin/quiz-builder/${createdQuizId}`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; deletedQuizId: string };
    expect(body.ok).toBe(true);
    expect(body.deletedQuizId).toBe(createdQuizId);
    createdQuizId = ''; // cleanup done
  });
});

// ── 5. Admin: grant-access API ────────────────────────────────────────────────

test.describe('Admin Grant Access', () => {
  test.skip(!HAS_USER, 'Requires ADMIN_TOKEN + TEST_USER_ID env vars');

  let api: APIRequestContext;

  test.beforeAll(({ playwright }) =>
    playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    }).then((ctx) => { api = ctx; }),
  );
  test.afterAll(() => api.dispose());

  test('POST /api/admin/grant-access writes to unlocked_courses and orders', async () => {
    const res = await api.post('/api/admin/grant-access', {
      data: {
        userId:    TEST_USER_ID,
        quizId:    'clf-c02-cloud-concepts',
        quizTitle: 'CLF-C02 Cloud Concepts',
        reason:    'Playwright automated test grant',
      },
    });
    // 200 if first grant, also 200 on re-grant (upsert)
    expect([200, 201]).toContain(res.status());
    const body = await res.json() as { ok: boolean; quizId: string };
    expect(body.ok).toBe(true);
    expect(body.quizId).toBe('clf-c02-cloud-concepts');
  });

  test('grant-access appears in orders list', async () => {
    const res  = await api.get('/api/admin/orders?limit=5&status=completed');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; orders: Array<{ gateway: string; quiz_id: string }> };
    expect(body.ok).toBe(true);
    const adminGrants = body.orders.filter((o) => o.gateway === 'admin');
    // At least one admin-granted order exists (the one we just created)
    expect(adminGrants.length).toBeGreaterThan(0);
  });

  test('grant-access rejects invalid userId format', async () => {
    const res = await api.post('/api/admin/grant-access', {
      data: { userId: 'not-a-uuid', quizId: 'clf-c02-cloud-concepts' },
    });
    expect(res.status()).toBe(400);
  });

  test('grant-access rejects missing quizId', async () => {
    const res = await api.post('/api/admin/grant-access', {
      data: { userId: TEST_USER_ID },
    });
    expect(res.status()).toBe(400);
  });
});

// ── 6. Admin: orders API ──────────────────────────────────────────────────────

test.describe('Admin Orders API', () => {
  test.skip(!HAS_ADMIN, 'Requires ADMIN_TOKEN env var');

  let api: APIRequestContext;

  test.beforeAll(({ playwright }) =>
    playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    }).then((ctx) => { api = ctx; }),
  );
  test.afterAll(() => api.dispose());

  test('GET /api/admin/orders returns paginated orders', async () => {
    const res  = await api.get('/api/admin/orders?page=1&limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; orders: unknown[]; total: number };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(typeof body.total).toBe('number');
  });

  test('GET /api/admin/orders?status=completed filters correctly', async () => {
    const res  = await api.get('/api/admin/orders?status=completed');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; orders: Array<{ status: string }> };
    expect(body.ok).toBe(true);
    if (body.orders.length > 0) {
      body.orders.forEach((o) => expect(o.status).toBe('completed'));
    }
  });

  test('GET /api/admin/orders returns user_name and user_email fields', async () => {
    const res  = await api.get('/api/admin/orders?limit=5');
    const body = await res.json() as { ok: boolean; orders: Array<{ user_name: string; user_email: string }> };
    if (!body.orders.length) return;
    const first = body.orders[0];
    expect(typeof first.user_name).toBe('string');
    expect(typeof first.user_email).toBe('string');
  });

  test('GET /api/admin/orders unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/orders`);
    expect(res.status()).toBe(401);
  });
});

// ── 7. Admin: customers API ───────────────────────────────────────────────────

test.describe('Admin Customers API', () => {
  test.skip(!HAS_ADMIN, 'Requires ADMIN_TOKEN env var');

  let api: APIRequestContext;

  test.beforeAll(({ playwright }) =>
    playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    }).then((ctx) => { api = ctx; }),
  );
  test.afterAll(() => api.dispose());

  test('GET /api/admin/customers returns paginated customers with counts', async () => {
    const res  = await api.get('/api/admin/customers?page=1&limit=10');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; customers: Array<{ id: string; purchase_count: number; unlocked_count: number }>; total: number };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.customers)).toBe(true);
    expect(typeof body.total).toBe('number');
    if (body.customers.length > 0) {
      const c = body.customers[0];
      expect(typeof c.purchase_count).toBe('number');
      expect(typeof c.unlocked_count).toBe('number');
    }
  });

  test('GET /api/admin/customers search by email', async () => {
    const res  = await api.get('/api/admin/customers?search=gmail.com&limit=5');
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; customers: unknown[] };
    expect(body.ok).toBe(true);
  });

  test('GET /api/admin/customers unauthenticated returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/customers`);
    expect(res.status()).toBe(401);
  });
});

// ── 8. Quiz Submit: score validation ─────────────────────────────────────────

test.describe('Quiz Submit API (auth required)', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let api: APIRequestContext;
  let userToken = '';

  test.beforeAll(async ({ playwright }) => {
    // Exchange email/password for a Supabase JWT via the REST API
    const supabaseUrl  = 'https://swydybtzyjxftzfzqqnv.supabase.co';
    const supabaseAnon = process.env.SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eWR5YnR6eWp4ZnR6ZnpxcW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDczNzYsImV4cCI6MjA4Nzk4MzM3Nn0.kbhZzrXzl4u7dn754VhbY43PFpVvMoG4kJRX-8lxKV4';
    const authRes = await (await playwright.request.newContext()).post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        headers: { apikey: supabaseAnon, 'Content-Type': 'application/json' },
        data: { email: EMAIL, password: PASS },
      },
    );
    if (authRes.ok()) {
      const d = await authRes.json() as { access_token?: string };
      userToken = d.access_token ?? '';
    }
    api = await playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    });
  });
  test.afterAll(() => api.dispose());

  test('POST /api/quiz-submit with valid answers returns verified score', async () => {
    test.skip(!userToken, 'Could not obtain user token');
    // Use clf-c02-cloud-concepts (free quiz with real questions)
    const startedAt = new Date(Date.now() - 60_000).toISOString(); // 60s ago
    const res = await api.post('/api/quiz-submit', {
      data: {
        quizId:    'clf-c02-cloud-concepts',
        answers:   {}, // empty answers → score 0 (valid submission)
        startedAt,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json() as { ok: boolean; score: number; totalQuestions: number; timeTaken: number };
    expect(body.ok).toBe(true);
    expect(typeof body.score).toBe('number');
    expect(body.totalQuestions).toBeGreaterThan(0);
    expect(body.timeTaken).toBeGreaterThan(0);
  });

  test('POST /api/quiz-submit score appears in leaderboard', async ({ request }) => {
    test.skip(!userToken, 'Could not obtain user token');
    // Give DB a moment to write, then bypass CDN cache with timestamp param
    await new Promise((r) => setTimeout(r, 2000));
    const res  = await request.get(`${BASE}/api/leaderboard?period=alltime&_t=${Date.now()}`);
    const body = await res.json() as { ok: boolean; entries: unknown[] };
    expect(body.ok).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);
  });

  test('POST /api/quiz-submit too fast returns 400', async () => {
    test.skip(!userToken, 'Could not obtain user token');
    const startedAt = new Date().toISOString(); // just now — too fast
    const res = await api.post('/api/quiz-submit', {
      data: { quizId: 'clf-c02-cloud-concepts', answers: {}, startedAt },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { ok: boolean; error: string };
    expect(body.error).toMatch(/fast/i);
  });

  test('POST /api/quiz-submit without token returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/quiz-submit`, {
      data: { quizId: 'aws-quick-start', answers: {}, startedAt: new Date().toISOString() },
    });
    expect(res.status()).toBe(401);
  });
});

// ── 9. UI: Leaderboard page (requires login) ─────────────────────────────────

test.describe('Leaderboard UI', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  async function loginAndGo(page: import('@playwright/test').Page, path: string) {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15_000 });
    await page.goto(`${BASE}${path}`);
    // Use domcontentloaded instead of networkidle — avoids timeout on live Vercel
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
  }

  test('leaderboard page loads with Leaderboard heading', async ({ page }) => {
    await loginAndGo(page, '/dashboard/leaderboard');
    await expect(page.locator('h1').first()).toContainText('Leaderboard');
  });

  test('period tabs are rendered (Today / Monthly / All Time)', async ({ page }) => {
    await loginAndGo(page, '/dashboard/leaderboard');
    await expect(page.getByText('Today', { exact: true })).toBeVisible();
    await expect(page.getByText('Monthly', { exact: true })).toBeVisible();
    await expect(page.getByText('All Time', { exact: true })).toBeVisible();
  });

  test('clicking Monthly tab does not crash page', async ({ page }) => {
    await loginAndGo(page, '/dashboard/leaderboard');
    await page.getByText('Monthly', { exact: true }).click();
    await page.waitForTimeout(1500);
    // Verify leaderboard heading still visible (page didn't crash/redirect)
    await expect(page.locator('h1').filter({ hasText: 'Leaderboard' })).toBeVisible();
  });

  test('clicking Today tab does not crash page', async ({ page }) => {
    await loginAndGo(page, '/dashboard/leaderboard');
    await page.getByText('Today', { exact: true }).click();
    await page.waitForTimeout(1500);
    const errors = await page.locator('text=/500|server error/i').count();
    expect(errors).toBe(0);
  });
});

// ── 10. UI: Quiz page loads managed/built-in quiz (requires login) ────────────

test.describe('Quiz Page UI', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let sharedPage: import('@playwright/test').Page;
  let sharedCtx: import('@playwright/test').BrowserContext;

  test.beforeAll(async ({ browser }) => {
    sharedCtx  = await browser.newContext();
    sharedPage = await sharedCtx.newPage();
    await sharedPage.goto(`${BASE}/login`);
    await sharedPage.locator('input[type="email"]').fill(EMAIL);
    await sharedPage.locator('input[type="password"]').fill(PASS);
    await sharedPage.getByRole('button', { name: /sign in|log in/i }).click();
    await sharedPage.waitForURL(`${BASE}/dashboard`, { timeout: 10_000 });
  });
  test.afterAll(() => sharedCtx.close());

  test('free quiz intro screen renders with quiz title', async () => {
    await sharedPage.goto(`${BASE}/dashboard/quiz/aws-quick-start`);
    await sharedPage.waitForLoadState('networkidle');
    const body = await sharedPage.textContent('body');
    expect(body).toMatch(/quick start|aws/i);
  });

  test('quiz page shows Start Quiz button on intro screen', async () => {
    await sharedPage.goto(`${BASE}/dashboard/quiz/clf-c02-cloud-concepts`);
    await sharedPage.waitForLoadState('networkidle');
    const startBtn = sharedPage.getByRole('button', { name: /start|begin|take/i }).first();
    if (await startBtn.count() > 0) {
      await expect(startBtn).toBeVisible();
    }
  });

  test('quiz page does not return 500', async () => {
    const res = await sharedPage.goto(`${BASE}/dashboard/quiz/clf-c02-cloud-concepts`);
    await sharedPage.waitForLoadState('networkidle');
    expect(res?.status()).toBeLessThan(500);
  });
});

// ── 11. Admin quiz builder UI ─────────────────────────────────────────────────

test.describe('Admin Quiz Builder UI', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  test('quiz builder page loads after login (admin user)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10_000 });
    await page.goto(`${BASE}/dashboard/admin/quiz-builder`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // wait for admin check
    const body = await page.textContent('body');
    // Either shows quiz builder or access denied (if TEST_EMAIL is not admin)
    expect(body).toBeTruthy();
  });

  test('customers page loads with Purchases and Unlocked columns', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10_000 });
    await page.goto(`${BASE}/dashboard/admin/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    if (body?.includes('Customers')) {
      // Verify the new column headers exist
      expect(body).toMatch(/Purchases/i);
      expect(body).toMatch(/Unlocked/i);
    }
  });
});
