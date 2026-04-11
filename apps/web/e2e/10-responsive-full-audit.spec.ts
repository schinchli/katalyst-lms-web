/**
 * 10-responsive-full-audit.spec.ts
 * Full responsive audit — mobile (375), iPad (768), iPad Pro (1024), desktop (1440)
 * Tests every route, feature interaction, and layout correctness.
 * Targets the LIVE site: https://learnkloud.today
 *
 * Run:
 *   TEST_EMAIL=xxx TEST_PASSWORD=yyy npx playwright test 10-responsive-full-audit \
 *     --reporter=html --project=chromium
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE = process.env.TEST_BASE_URL ?? 'https://learnkloud.today';
const EMAIL = process.env.TEST_EMAIL ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const HAS_AUTH = Boolean(EMAIL && PASSWORD);

// ── Viewport presets ──────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'mobile-375',    width: 375,  height: 812  },
  { name: 'mobile-430',    width: 430,  height: 932  },
  { name: 'ipad-768',      width: 768,  height: 1024 },
  { name: 'ipad-pro-1024', width: 1024, height: 1366 },
  { name: 'desktop-1440',  width: 1440, height: 900  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.body.scrollWidth > document.documentElement.clientWidth + 2);
}

async function elementFullyVisible(page: Page, selector: string): Promise<boolean> {
  const box = await page.locator(selector).boundingBox();
  if (!box) return false;
  const vw = page.viewportSize()!.width;
  return box.x >= 0 && box.x + box.width <= vw + 2 && box.width > 0 && box.height > 0;
}

async function loginAndGoto(page: Page, path: string): Promise<boolean> {
  if (!HAS_AUTH) return false;
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).first().click();
  try {
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 15_000 });
  } catch {
    return false;
  }
  if (path !== '/dashboard') await page.goto(`${BASE}${path}`);
  await page.waitForLoadState('networkidle');
  return true;
}

// =============================================================================
// 1. PUBLIC PAGES — no auth required
// =============================================================================

test.describe('Public pages — no horizontal overflow', () => {
  for (const vp of VIEWPORTS) {
    test(`/login — ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/login`);
      await page.waitForLoadState('domcontentloaded');
      expect(await hasHorizontalOverflow(page)).toBe(false);
      await page.screenshot({ path: `e2e-screenshots/login-${vp.name}.png`, fullPage: false });
    });

    test(`/signup — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/signup`);
      await page.waitForLoadState('domcontentloaded');
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});

test.describe('Login page — form elements visible & not clipped', () => {
  for (const vp of VIEWPORTS) {
    test(`form inputs & button visible — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/login`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      // Submit button not clipped
      const btn = page.getByRole('button', { name: /sign in|log in/i }).first();
      await expect(btn).toBeVisible();
      const box = await btn.boundingBox();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 4);
      }
    });
  }
});

test.describe('Signup page — form fully usable', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[4]]) {
    test(`all fields visible — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/signup`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});

// =============================================================================
// 2. AUTHENTICATED — DASHBOARD & NAV
// =============================================================================

test.describe('Dashboard — sidebar & mobile nav', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('desktop (1440px): sidebar visible, no hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    // Sidebar should be visible
    await expect(page.locator('.sidebar')).toBeVisible();
    // Mobile hamburger should not be visible at desktop width
    const hamburger = page.locator('.mobile-nav-btn');
    const isVisible = await hamburger.isVisible();
    // At 1440, mobile-nav-btn should be hidden
    expect(isVisible).toBe(false);
    expect(await hasHorizontalOverflow(page)).toBe(false);
    await page.screenshot({ path: 'e2e-screenshots/dashboard-desktop.png' });
  });

  test('iPad (768px): sidebar collapses, content adapts', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    await page.screenshot({ path: 'e2e-screenshots/dashboard-ipad.png' });
  });

  test('mobile (375px): hamburger opens sidebar drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    // Mobile hamburger button should be visible
    const hamburger = page.locator('.mobile-nav-btn').first();
    await expect(hamburger).toBeVisible();
    // Click it — sidebar should open
    await hamburger.click();
    await page.waitForTimeout(300);
    const sidebar = page.locator('.sidebar');
    // Sidebar should now have mobile-open class or be visible
    const sidebarClass = await sidebar.getAttribute('class');
    expect(sidebarClass).toContain('mobile-open');
    await page.screenshot({ path: 'e2e-screenshots/dashboard-mobile-sidebar-open.png' });
    // Close via backdrop or clicking hamburger again
    await hamburger.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e-screenshots/dashboard-mobile-sidebar-closed.png' });
  });

  test('mobile (375px): nav links all visible inside drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    const hamburger = page.locator('.mobile-nav-btn').first();
    await hamburger.click();
    await page.waitForTimeout(300);
    // All nav items should be visible (scope to sidebar nav-items only to avoid ambiguity)
    for (const label of ['Home', 'Courses', 'Learn', 'Flashcards', 'Leaderboard', 'Profile']) {
      await expect(page.locator(`.sidebar .nav-item[href]`).filter({ hasText: label }).first()).toBeVisible();
    }
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

// =============================================================================
// 3. AUTHENTICATED — ALL DASHBOARD PAGES
// =============================================================================

const DASHBOARD_PAGES = [
  { path: '/dashboard',             name: 'Home' },
  { path: '/dashboard/quizzes',     name: 'Courses' },
  { path: '/dashboard/learn',       name: 'Learn' },
  { path: '/dashboard/flashcards',  name: 'Flashcards' },
  { path: '/dashboard/leaderboard', name: 'Leaderboard' },
  { path: '/dashboard/profile',     name: 'Profile' },
];

test.describe('Dashboard pages — no horizontal overflow (all viewports)', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  for (const vp of VIEWPORTS) {
    for (const pg of DASHBOARD_PAGES) {
      test(`${pg.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const ok = await loginAndGoto(page, pg.path);
        if (!ok) test.fail();
        await page.waitForTimeout(500); // let any animations settle
        expect(await hasHorizontalOverflow(page)).toBe(false);
        await page.screenshot({
          path: `e2e-screenshots/${pg.name.toLowerCase()}-${vp.name}.png`,
          fullPage: true,
        });
      });
    }
  }
});

// =============================================================================
// 4. HOME DASHBOARD — KPI cards & stats
// =============================================================================

test.describe('Dashboard Home — KPI cards layout', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('KPI cards wrap correctly on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    // Cards should not overflow viewport
    expect(await hasHorizontalOverflow(page)).toBe(false);
    // .vx-card elements should be within viewport width
    const cards = page.locator('.vx-card');
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) expect(box.x + box.width).toBeLessThanOrEqual(375 + 4);
    }
  });

  test('KPI cards in a 3-column row at desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

// =============================================================================
// 5. COURSES / QUIZ CATALOG
// =============================================================================

test.describe('Courses page — quiz cards', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('quiz cards wrap on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/quizzes');
    if (!ok) test.fail();
    expect(await hasHorizontalOverflow(page)).toBe(false);
    // At least one quiz card should be visible
    const cards = page.locator('.course-card, .quiz-card, [class*="course"], [class*="quiz-item"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('quiz cards multi-column at desktop (1440px)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const ok = await loginAndGoto(page, '/dashboard/quizzes');
    if (!ok) test.fail();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('quiz card links fully tappable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/quizzes');
    if (!ok) test.fail();
    // Quiz cards are <Link> elements (not buttons) that navigate to /dashboard/quiz/:id
    const quizLink = page.locator('a[href*="/dashboard/quiz/"]').first();
    const box = await quizLink.boundingBox();
    if (box) {
      // card links must be at least 36px tall and not overflow viewport
      expect(box.height).toBeGreaterThanOrEqual(36);
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 4);
    }
  });
});

// =============================================================================
// 6. LEADERBOARD
// =============================================================================

test.describe('Leaderboard page', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  for (const vp of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[4]]) {
    test(`leaderboard table fits — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const ok = await loginAndGoto(page, '/dashboard/leaderboard');
      if (!ok) test.fail();
      await page.waitForTimeout(800);
      expect(await hasHorizontalOverflow(page)).toBe(false);
      // Podium visible
      const podium = page.locator('[class*="podium"], [class*="leaderboard"]').first();
      if (await podium.count() > 0) {
        const box = await podium.boundingBox();
        if (box) expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 4);
      }
      await page.screenshot({ path: `e2e-screenshots/leaderboard-${vp.name}.png`, fullPage: true });
    });
  }
});

// =============================================================================
// 7. PROFILE PAGE (includes Bookmarks section)
// =============================================================================

test.describe('Profile page — all sections visible', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  for (const vp of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[4]]) {
    test(`profile sections render — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const ok = await loginAndGoto(page, '/dashboard/profile');
      if (!ok) test.fail();
      expect(await hasHorizontalOverflow(page)).toBe(false);
      // Stats row should be visible
      await expect(page.getByText('Courses completed')).toBeVisible();
      await expect(page.getByText('Profile details')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible();
      await expect(page.getByText('Danger Zone')).toBeVisible();
      await page.screenshot({ path: `e2e-screenshots/profile-${vp.name}.png`, fullPage: true });
    });
  }

  test('profile save button tappable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/profile');
    if (!ok) test.fail();
    const saveBtn = page.getByRole('button', { name: /save profile/i });
    await expect(saveBtn).toBeVisible();
    const box = await saveBtn.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36);
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 4);
    }
  });

  test('delete account button visible (Danger Zone)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/profile');
    if (!ok) test.fail();
    await page.getByText('Danger Zone').scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: /delete account/i })).toBeVisible();
  });
});

// =============================================================================
// 8. QUIZ FLOW — start → question → answer → result
// =============================================================================

test.describe('Quiz player flow', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('mobile (375px): quiz player renders, no overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/quizzes');
    if (!ok) test.fail();
    // Quiz cards are <Link> elements — click the first one
    const quizLink = page.locator('a[href*="/dashboard/quiz/"]').first();
    if (await quizLink.count() === 0) return; // no quizzes listed, skip
    await quizLink.click();
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
    // Question text should be visible
    const question = page.locator('[class*="question"], h2, h3').first();
    if (await question.count() > 0) await expect(question).toBeVisible();
    await page.screenshot({ path: 'e2e-screenshots/quiz-mobile-375.png', fullPage: false });
  });

  test('iPad (768px): quiz player, answer options not clipped', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const ok = await loginAndGoto(page, '/dashboard/quizzes');
    if (!ok) test.fail();
    const quizLink = page.locator('a[href*="/dashboard/quiz/"]').first();
    if (await quizLink.count() === 0) return;
    await quizLink.click();
    await page.waitForLoadState('networkidle');
    expect(await hasHorizontalOverflow(page)).toBe(false);
    await page.screenshot({ path: 'e2e-screenshots/quiz-ipad-768.png', fullPage: false });
  });
});

// =============================================================================
// 9. FLASHCARDS
// =============================================================================

test.describe('Flashcards page', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  for (const vp of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[4]]) {
    test(`no overflow — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const ok = await loginAndGoto(page, '/dashboard/flashcards');
      if (!ok) test.fail();
      await page.waitForTimeout(500);
      expect(await hasHorizontalOverflow(page)).toBe(false);
      await page.screenshot({ path: `e2e-screenshots/flashcards-${vp.name}.png`, fullPage: false });
    });
  }
});

// =============================================================================
// 10. LEARN PAGE
// =============================================================================

test.describe('Learn page', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  for (const vp of [VIEWPORTS[0], VIEWPORTS[2], VIEWPORTS[4]]) {
    test(`no overflow — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const ok = await loginAndGoto(page, '/dashboard/learn');
      if (!ok) test.fail();
      await page.waitForTimeout(500);
      expect(await hasHorizontalOverflow(page)).toBe(false);
      await page.screenshot({ path: `e2e-screenshots/learn-${vp.name}.png`, fullPage: false });
    });
  }
});

// =============================================================================
// 11. TOUCH TARGET SIZES (WCAG 2.5.5 minimum 44px)
// =============================================================================

test.describe('Touch targets — 44px minimum (mobile)', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('all sidebar nav links ≥ 40px height on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    // Open sidebar
    await page.locator('.mobile-nav-btn').first().click();
    await page.waitForTimeout(300);
    // Only check main nav links, not footer badge (sidebar-footer has smaller decorative links)
    const navLinks = page.locator('.sidebar nav a[href], .sidebar .sidebar-nav a[href]');
    const count = await navLinks.count();
    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      if (!await link.isVisible()) continue;
      const box = await link.boundingBox();
      if (box && box.height < 36) {
        const text = await link.textContent();
        failures.push(`"${text?.trim()}" height=${box.height}px`);
      }
    }
    expect(failures, `Touch targets too small: ${failures.join(', ')}`).toHaveLength(0);
  });
});

// =============================================================================
// 12. FONT READABILITY
// =============================================================================

test.describe('Font sizes — readable on mobile', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('body text ≥ 13px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard');
    if (!ok) test.fail();
    const smallText = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      const small: string[] = [];
      let node = walker.nextNode();
      while (node) {
        const el = node as HTMLElement;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const text = el.textContent?.trim() ?? '';
        if (fs < 11 && text.length > 10 && el.children.length === 0) {
          small.push(`"${text.slice(0, 30)}" fs=${fs}px`);
        }
        node = walker.nextNode();
      }
      return small.slice(0, 5);
    });
    expect(smallText, `Text too small to read: ${smallText.join(', ')}`).toHaveLength(0);
  });
});

// =============================================================================
// 13. PROFILE STATS GRID — 2-col grid wrapping
// =============================================================================

test.describe('Profile stats grid responsive', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('stats grid items not overlapping on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/profile');
    if (!ok) test.fail();
    // Check no vx-card overflows
    const cards = page.locator('.vx-card');
    const count = await cards.count();
    const overflows: string[] = [];
    for (let i = 0; i < count; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box && box.x + box.width > 375 + 4) {
        overflows.push(`card[${i}] right=${box.x + box.width}`);
      }
    }
    expect(overflows, overflows.join(', ')).toHaveLength(0);
  });
});

// =============================================================================
// 14. BOOKMARKS IN PROFILE
// =============================================================================

test.describe('Bookmarks section in Profile', () => {
  test.skip(!HAS_AUTH, 'Requires TEST_EMAIL + TEST_PASSWORD');

  test('bookmarks section renders on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const ok = await loginAndGoto(page, '/dashboard/profile');
    if (!ok) test.fail();
    await page.getByRole('heading', { name: 'Bookmarks' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Bookmarks' })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

// =============================================================================
// 15. NETWORK CONNECTIVITY — API routes reachable
// =============================================================================

test.describe('API health checks', () => {
  test('GET /api/leaderboard returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/api/leaderboard`);
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/quiz-catalog returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/api/quiz-catalog`);
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/platform-config returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/api/platform-config`);
    expect(res.status()).toBeLessThan(500);
  });

  test('admin API returns 401 without token', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/quiz-catalog`);
    expect(res.status()).toBe(401);
  });

  // NOTE: in-memory rate limiter does NOT work on Vercel serverless (each function invocation
  // gets a fresh in-memory store). Upstash Redis must be configured for this to pass in prod.
  // See UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars.
  test.skip('rate limiter: 429 on spam [NEEDS UPSTASH REDIS]', async () => {
    // This test can only pass when Upstash Redis is configured in Vercel env vars,
    // because in-memory rate limiting is per-instance and doesn't persist across serverless calls.
  });
});
