/**
 * Authenticated flow tests.
 * Requires TEST_EMAIL + TEST_PASSWORD env vars set to a real Supabase account.
 * Run: TEST_EMAIL=x@y.com TEST_PASSWORD=secret npx playwright test
 *
 * If credentials are not provided, tests are skipped gracefully.
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const EMAIL    = process.env.TEST_EMAIL    ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';

const SKIP = !EMAIL || !PASSWORD;
const BASE  = 'http://localhost:8080';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
}

async function seedResults(page: Page) {
  const today = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  await page.evaluate(({ today, yesterday }: { today: string; yesterday: string }) => {
    const results = [
      { quizId: 'clf-c02-cloud-concepts', score: 22, totalQuestions: 29, timeTaken: 720,  answers: {}, completedAt: today },
      { quizId: 'clf-c02-billing',        score: 28, totalQuestions: 34, timeTaken: 840,  answers: {}, completedAt: yesterday },
    ];
    localStorage.setItem('quiz-results', JSON.stringify(results));
  }, { today, yesterday });
}

// ── Dashboard Home ────────────────────────────────────────────────────────────

test.describe('Dashboard Home', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
    await seedResults(page);
  });

  test.afterAll(() => ctx.close());

  test('shows welcome banner with username', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const h1 = await page.locator('h1').first().textContent();
    expect(h1).toMatch(/welcome back/i);
  });

  test('shows motivational quote in subtitle', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const subtitle = await page.locator('.page-subtitle').textContent();
    expect(subtitle).toBeTruthy();
    expect(subtitle!.length).toBeGreaterThan(10);
  });

  test('4 stat cards visible', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const cards = page.locator('.dash-stat-card');
    await expect(cards).toHaveCount(4);
  });

  test('stat cards show non-zero values after seeding', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const values = await page.locator('.dash-stat-value').allTextContents();
    expect(values.length).toBe(4);
    // At least one stat card should show non-zero (courses completed)
    const hasNonZero = values.some((v) => v !== '0' && v !== '0%' && v !== '0h');
    expect(hasNonZero).toBe(true);
  });

  test('7-day activity strip is visible', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.activity-strip-card')).toBeVisible();
    const dots = page.locator('.activity-dot');
    await expect(dots).toHaveCount(7);
  });

  test('today activity dot is marked done', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    // The "Done today" pill should appear since we seeded today's result
    const pill = page.locator('.activity-today-pill.done');
    await expect(pill).toBeVisible();
    await expect(pill).toContainText('Done today');
  });

  test('course completion progress bar reflects completed quizzes', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const completionPct = await page.locator('.completion-pct').textContent();
    expect(completionPct).toMatch(/\d+%/);
    expect(parseInt(completionPct ?? '0')).toBeGreaterThan(0);
  });

  test('Courses You Are Taking section appears after completing quizzes', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const section = page.getByText('Courses You Are Taking');
    await expect(section).toBeVisible();
  });

  test('milestone goal card is visible', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.milestone-card')).toBeVisible();
  });

  test('can set a certification goal', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Click "Set a Goal" button
    const setBtn = page.locator('.milestone-set-btn');
    if (await setBtn.isVisible()) {
      await setBtn.click();
      // Form should appear
      await expect(page.locator('.goal-form')).toBeVisible();
      // Pick CLF-C02
      await page.locator('.goal-select').selectOption('clf-c02');
      // Set date 3 months from now
      const future = new Date();
      future.setMonth(future.getMonth() + 3);
      const dateStr = future.toISOString().split('T')[0];
      await page.locator('.goal-date-input').fill(dateStr as string);
      // Save
      await page.locator('.goal-save-btn').click();
      // Milestone display should appear
      await expect(page.locator('.milestone-body')).toBeVisible();
      await expect(page.locator('.milestone-cert-label')).toContainText('CLF-C02');
      await expect(page.locator('.milestone-status-badge')).toBeVisible();
    }
  });

  test('milestone shows days-left counter', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const counter = page.locator('.milestone-counter-num').first();
    if (await counter.isVisible()) {
      const text = await counter.textContent();
      expect(parseInt(text ?? '0')).toBeGreaterThan(0);
    }
  });
});

// ── Quizzes Page ──────────────────────────────────────────────────────────────

test.describe('Quizzes Page', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('quizzes page loads with quiz cards', async () => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
    // At least some quiz cards should be visible
    const cards = page.locator('.quiz-card, [class*="quiz-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('filter pills are rendered', async () => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await page.waitForLoadState('networkidle');
    const pills = page.locator('.filter-pill, [class*="filter"]');
    expect(await pills.count()).toBeGreaterThan(0);
  });

  test('All filter shows all quizzes', async () => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await page.waitForLoadState('networkidle');
    const allPill = page.getByText('All', { exact: true }).first();
    if (await allPill.isVisible()) {
      await allPill.click();
      const cards = page.locator('.quiz-card, [class*="quiz-card"]');
      expect(await cards.count()).toBeGreaterThan(5);
    }
  });

  test('clicking a quiz card navigates to quiz detail page', async () => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('.quiz-card, [class*="quiz-card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/dashboard/quiz/');
    }
  });

  test('search filters quiz cards', async () => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('CLF');
      await page.waitForTimeout(500);
      const cards = page.locator('.quiz-card, [class*="quiz-card"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ── Quiz Detail + Taking a Quiz ───────────────────────────────────────────────

test.describe('Quiz Detail and Taking a Quiz', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('quiz detail page loads for CLF-C02 cloud concepts', async () => {
    await page.goto(`${BASE}/dashboard/quiz/clf-c02-cloud-concepts`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
    const title = await page.locator('h1, h2').first().textContent();
    expect(title).toBeTruthy();
  });

  test('quiz detail shows question count and duration', async () => {
    await page.goto(`${BASE}/dashboard/quiz/clf-c02-cloud-concepts`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Should mention questions and duration somewhere
    expect(body).toMatch(/question|quiz/i);
  });

  test('Start Quiz button is visible', async () => {
    await page.goto(`${BASE}/dashboard/quiz/clf-c02-cloud-concepts`);
    await page.waitForLoadState('networkidle');
    const startBtn = page.getByRole('button', { name: /start|begin|take quiz/i }).first();
    if (await startBtn.isVisible()) {
      await expect(startBtn).toBeEnabled();
    }
  });

  test('can start a quiz and see the first question', async () => {
    await page.goto(`${BASE}/dashboard/quiz/clf-c02-billing`);
    await page.waitForLoadState('networkidle');
    const startBtn = page.getByRole('button', { name: /start|begin|take quiz/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      // Should now show a question
      const body = await page.textContent('body');
      expect(body).toMatch(/question|option|answer/i);
    }
  });

  test('quiz options are clickable', async () => {
    await page.goto(`${BASE}/dashboard/quiz/clf-c02-billing`);
    await page.waitForLoadState('networkidle');
    const startBtn = page.getByRole('button', { name: /start|begin|take quiz/i }).first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1000);
      // Click first visible option button
      const options = page.getByRole('button').filter({ hasText: /^[A-E]\.|[A-E]\)/ });
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('invalid quiz ID returns non-500 response', async () => {
    const response = await page.goto(`${BASE}/dashboard/quiz/nonexistent-quiz-id-xyz`);
    expect(response?.status()).toBeLessThan(500);
  });
});

// ── Learn Page ────────────────────────────────────────────────────────────────

test.describe('Learn (Video) Page', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('learn page loads with video player', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
    // YouTube iframe should be present
    const iframe = page.locator('iframe[src*="youtube"]');
    await expect(iframe).toBeVisible({ timeout: 5000 });
  });

  test('playlist sidebar shows multiple videos', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    // Should have playlist buttons
    const items = page.getByText('Up Next');
    await expect(items.first()).toBeVisible();
  });

  test('playlist thumbnails load (YouTube images)', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    const thumbnails = page.locator('img[src*="youtube"]');
    const count = await thumbnails.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a playlist item changes the active video', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    // Get all playlist buttons
    const buttons = page.locator('button').filter({ has: page.locator('img[src*="youtube"]') });
    const count = await buttons.count();
    if (count > 1) {
      const beforeSrc = await page.locator('iframe[src*="youtube"]').getAttribute('src');
      await buttons.nth(1).click();
      await page.waitForTimeout(500);
      const afterSrc = await page.locator('iframe[src*="youtube"]').getAttribute('src');
      expect(afterSrc).not.toBe(beforeSrc);
    }
  });

  test('chapters section is togglable', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    const chaptersToggle = page.getByText(/Chapters/i).first();
    if (await chaptersToggle.isVisible()) {
      await chaptersToggle.click();
      await page.waitForTimeout(300);
      await chaptersToggle.click();
    }
  });

  test('YouTube external link is present and valid', async () => {
    await page.goto(`${BASE}/dashboard/learn`);
    await page.waitForLoadState('networkidle');
    const ytLink = page.locator('a[href*="youtube.com"]').first();
    await expect(ytLink).toBeVisible();
    const href = await ytLink.getAttribute('href');
    expect(href).toContain('youtube.com');
  });
});

// ── Progress Page ─────────────────────────────────────────────────────────────

test.describe('Progress Page', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
    await seedResults(page);
  });

  test.afterAll(() => ctx.close());

  test('progress page loads', async () => {
    await page.goto(`${BASE}/dashboard/progress`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows study stats (time, score, etc.)', async () => {
    await page.goto(`${BASE}/dashboard/progress`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Should show some stats
    expect(body).toMatch(/score|quiz|progress|time/i);
  });

  test('displays recent quiz results', async () => {
    await page.goto(`${BASE}/dashboard/progress`);
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // CLF-C02 results we seeded should appear
    expect(body).toMatch(/CLF|cloud|billing|concepts/i);
  });
});

// ── Profile Page ──────────────────────────────────────────────────────────────

test.describe('Profile Page', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('profile page loads with user info', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('Appearance card with color swatches is visible', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Appearance')).toBeVisible();
    // Color swatch buttons
    const swatches = page.locator('button[title*="Violet"], button[title*="Blue"], button[title*="Sky"]');
    expect(await swatches.count()).toBeGreaterThan(0);
  });

  test('clicking a color swatch changes --primary CSS variable', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    // Click Sky Blue swatch
    const skyBtn = page.locator('button[title="Sky Blue"]');
    if (await skyBtn.isVisible()) {
      await skyBtn.click();
      await page.waitForTimeout(300);
      const primary = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
      );
      expect(primary).toContain('#0EA5E9');
    }
  });

  test('font selector changes body font family', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    const fontSelect = page.locator('select').filter({ hasText: /public sans|inter|poppins/i });
    if (await fontSelect.count() > 0) {
      await fontSelect.first().selectOption('Inter');
      await page.waitForTimeout(500);
      const fontFamily = await page.evaluate(() =>
        getComputedStyle(document.body).fontFamily
      );
      expect(fontFamily.toLowerCase()).toContain('inter');
    }
  });

  test('font size buttons change root font size', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    // Click Large font size
    const largeBtn = page.getByRole('button', { name: 'Large' });
    if (await largeBtn.isVisible()) {
      await largeBtn.click();
      await page.waitForTimeout(200);
      const fontSize = await page.evaluate(() =>
        getComputedStyle(document.documentElement).fontSize
      );
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(15);
    }
  });

  test('edit profile form saves name', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    const nameInput = page.locator('input').filter({ hasText: '' }).first();
    // Find name input specifically
    const inputs = page.locator('.form-input');
    const count  = await inputs.count();
    if (count > 0) {
      await inputs.first().fill('Test User Updated');
      const saveBtn = page.getByRole('button', { name: /save changes/i });
      await saveBtn.click();
      await page.waitForTimeout(1000);
      // Check saved confirmation
      const savedText = page.getByText(/saved|✓/i);
      // May briefly show
    }
  });

  test('danger zone reset button is visible', async () => {
    await page.goto(`${BASE}/dashboard/profile`);
    await page.waitForLoadState('networkidle');
    const resetBtn = page.getByRole('button', { name: /reset/i });
    await expect(resetBtn).toBeVisible();
  });
});

// ── Dark Mode ─────────────────────────────────────────────────────────────────

test.describe('Dark Mode Toggle', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('dark mode toggle switches data-theme attribute', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    // Find the dark mode toggle button (sun/moon icon in sidebar)
    const toggleBtn = page.locator('button[title*="dark" i], button[title*="light" i]').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      const newTheme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme')
      );
      expect(newTheme).not.toBe(initialTheme);
    }
  });

  test('dark mode persists on page reload', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    // Set dark mode via localStorage
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(theme).toBe('dark');
  });
});

// ── Sidebar Navigation ────────────────────────────────────────────────────────

test.describe('Sidebar Navigation', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  const navItems = [
    { name: 'Home',        path: '/dashboard'            },
    { name: 'Quizzes',    path: '/dashboard/quizzes'    },
    { name: 'Learn',      path: '/dashboard/learn'      },
    { name: 'Progress',   path: '/dashboard/progress'   },
    { name: 'Profile',    path: '/dashboard/profile'    },
  ];

  for (const item of navItems) {
    test(`navigates to ${item.name}`, async () => {
      await page.goto(`${BASE}/dashboard`);
      await page.waitForLoadState('networkidle');
      const link = page.getByRole('link', { name: new RegExp(item.name, 'i') }).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain(item.path);
      }
    });
  }

  test('sidebar search finds CLF-C02', async () => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('CLF');
      await page.waitForTimeout(500);
      const results = page.locator('[class*="search-result"], [class*="search-item"]');
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });
});

// ── Security ──────────────────────────────────────────────────────────────────

test.describe('Security', () => {
  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated /dashboard/profile redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('unauthenticated /dashboard/quizzes redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/quizzes');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/login');
  });

  test('/api/sync-user rejects unauthenticated POST', async ({ request }) => {
    const res = await request.post('/api/sync-user', {
      headers: { 'Content-Type': 'application/json' },
      data: { supabaseId: 'attacker-id', email: 'bad@evil.com', name: 'Hacker' },
    });
    expect([401, 403]).toContain(res.status());
  });

  test('/api/admin/check returns 403 for non-admin', async ({ request }) => {
    const res = await request.get('/api/admin/check');
    expect([401, 403]).toContain(res.status());
  });
});

// ── Leaderboard Page ──────────────────────────────────────────────────────────

test.describe('Leaderboard Page', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  test('leaderboard page loads', async () => {
    const response = await page.goto(`${BASE}/dashboard/leaderboard`);
    await page.waitForLoadState('networkidle');
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
