/**
 * Phase F — Layout & Responsiveness Tests
 *
 * Validates: page-content wrapper usage, no horizontal overflow, consistent
 * page padding, dc-hero standardised padding, mobile viewport rendering,
 * and container widths.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';

// ── Page-content Class & Layout Standardisation ───────────────────────────────

test.describe('Phase F — Layout: page-content CSS class', () => {
  test('.page-content CSS class defines max-width', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const maxWidth = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'page-content';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const mw = getComputedStyle(el).maxWidth;
      document.body.removeChild(el);
      return mw;
    });
    // page-content sets max-width: 1100px
    const px = parseInt(maxWidth);
    expect(px).toBeGreaterThanOrEqual(900);
    expect(px).toBeLessThanOrEqual(1400);
  });

  test('.page-content has horizontal padding', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const padding = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'page-content';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const pl = getComputedStyle(el).paddingLeft;
      document.body.removeChild(el);
      return pl;
    });
    expect(parseInt(padding)).toBeGreaterThanOrEqual(12);
  });

  test('.dc-hero has padding: 30px by default', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const padding = await page.evaluate(() => {
      const el = document.createElement('section');
      el.className = 'dc-hero';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const p = getComputedStyle(el).padding;
      document.body.removeChild(el);
      return p;
    });
    // 30px padding (may be shorthand or individual sides)
    expect(parseInt(padding)).toBe(30);
  });
});

// ── No Horizontal Overflow ────────────────────────────────────────────────────

test.describe('Phase F — Layout: no horizontal overflow (desktop)', () => {
  const pages = [
    { name: 'login', path: '/login' },
    { name: 'dashboard (redirect)', path: '/dashboard' },
  ];

  for (const p of pages) {
    test(`no horizontal scrollbar on ${p.name} at 1280px`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${BASE}${p.path}`);
      await page.waitForLoadState('domcontentloaded');
      const overflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);
    });
  }
});

// ── Mobile Viewport ───────────────────────────────────────────────────────────

test.describe('Phase F — Layout: mobile viewport (375px)', () => {
  test('login page renders without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(() =>
      document.body.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('login form is visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('submit button is not clipped on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`);
    const btn = page.getByRole('button', { name: /sign in|log in/i });
    const box = await btn.boundingBox();
    // Button should be fully within the viewport width
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375 + 5); // 5px tolerance
    }
  });

  test('.page-content uses 12px padding on mobile (CSS override)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/login`);
    const padding = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'page-content';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const pl = getComputedStyle(el).paddingLeft;
      document.body.removeChild(el);
      return pl;
    });
    // Mobile override: 12px padding-left
    expect(parseInt(padding)).toBeLessThanOrEqual(20);
  });
});

// ── Tablet Viewport ───────────────────────────────────────────────────────────

test.describe('Phase F — Layout: tablet viewport (768px)', () => {
  test('login page renders without overflow at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/login`);
    await page.waitForLoadState('domcontentloaded');
    const overflow = await page.evaluate(() =>
      document.body.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
});

// ── Container Consistency (authenticated) ────────────────────────────────────

test.describe('Phase F — Layout: authenticated page widths', () => {
  test.skip(!process.env.TEST_EMAIL, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  const dashboardPages = [
    '/dashboard',
    '/dashboard/quizzes',
    '/dashboard/leaderboard',
    '/dashboard/progress',
    '/dashboard/bookmarks',
    '/dashboard/contests',
  ];

  for (const path of dashboardPages) {
    test(`${path} uses page-content wrapper (consistent max-width)`, async ({ page }) => {
      const EMAIL = process.env.TEST_EMAIL!;
      const PASSWORD = process.env.TEST_PASSWORD!;
      await page.goto(`${BASE}/login`);
      await page.locator('input[type="email"]').fill(EMAIL);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.getByRole('button', { name: /sign in|log in/i }).click();
      await page.waitForURL(`${BASE}/dashboard`, { timeout: 10_000 });
      await page.goto(`${BASE}${path}`);
      await page.waitForLoadState('networkidle');

      const hasPageContent = await page.locator('.page-content').count();
      expect(hasPageContent).toBeGreaterThan(0);
    });
  }
});
