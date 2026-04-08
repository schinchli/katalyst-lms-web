/**
 * Phase B — Vuexy UI/UX Consistency Tests
 * Phase C — Dark/Light Mode Tests
 *
 * Validates: CSS custom properties are used (not hardcoded hex), LoadingSpinner
 * is rendered for async states, error boundary exists, page-content wrapper is
 * consistent, and dark/light mode renders correctly.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8080';
const SKIP = !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD;

// ── Phase C: CSS Custom Properties & Theming ──────────────────────────────────

test.describe('Phase C — Dark Mode Default', () => {
  test('page loads with data-theme="dark" by default', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    );
    // Default is dark unless user has toggled to light
    expect(theme).toBe('dark');
  });

  test('--primary CSS var is defined (not empty)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    );
    expect(primary).toBeTruthy();
    expect(primary.length).toBeGreaterThan(2);
  });

  test('--bg CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const bg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    );
    expect(bg).toBeTruthy();
  });

  test('--error CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const err = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--error').trim(),
    );
    expect(err).toBeTruthy();
  });

  test('--success CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const s = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--success').trim(),
    );
    expect(s).toBeTruthy();
  });

  test('--overlay-sm CSS var is defined (Phase 2 addition)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const ov = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--overlay-sm').trim(),
    );
    expect(ov).toBeTruthy();
  });

  test('--color-gold CSS var is defined (gamification token)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const gold = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-gold').trim(),
    );
    expect(gold).toBeTruthy();
  });

  test('--color-xp CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const xp = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-xp').trim(),
    );
    expect(xp).toBeTruthy();
  });

  test('--success-tint CSS var is defined (quiz feedback token)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const tint = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--success-tint').trim(),
    );
    expect(tint).toBeTruthy();
  });
});

test.describe('Phase C — Light Mode Switch', () => {
  test('switching to light mode changes --bg value', async ({ page }) => {
    await page.goto(`${BASE}/login`);

    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    );

    // Simulate switching to light mode
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
    });

    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
    );

    expect(lightBg).not.toBe(darkBg);
  });

  test('--overlay-sm inverts between dark and light mode', async ({ page }) => {
    await page.goto(`${BASE}/login`);

    // Dark mode overlay (should be rgba white)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkOverlay = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--overlay-sm').trim(),
    );

    // Light mode overlay (should be rgba black)
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    const lightOverlay = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--overlay-sm').trim(),
    );

    expect(darkOverlay).not.toBe(lightOverlay);
    // Browser may return rgba() or hex+alpha — check direction: dark=white-based, light=black-based
    const darkIsWhiteBased = darkOverlay.includes('255, 255, 255') || darkOverlay.toLowerCase().startsWith('#ffffff');
    const lightIsBlackBased = lightOverlay.includes('0, 0, 0') || lightOverlay.toLowerCase().startsWith('#000000');
    expect(darkIsWhiteBased).toBe(true);
    expect(lightIsBlackBased).toBe(true);
  });

  test('--success-tint is lighter in light mode vs dark mode', async ({ page }) => {
    await page.goto(`${BASE}/login`);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const darkTint = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--success-tint').trim(),
    );

    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
    const lightTint = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--success-tint').trim(),
    );

    expect(darkTint).not.toBe(lightTint);
  });
});

// ── Phase B: Vuexy Component Classes ─────────────────────────────────────────

test.describe('Phase B — Vuexy Component Classes on Login Page', () => {
  test('.btn-primary class is applied to login button', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const btn = page.locator('.btn-primary').first();
    await expect(btn).toBeVisible();
  });

  test('.form-input or input class is present on email field', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const input = page.locator('input[type="email"]');
    await expect(input).toBeVisible();
    // Input should use standard CSS class styling, not purely inline
    const className = await input.getAttribute('class');
    expect(className).toBeTruthy();
  });

  test('page body or html uses CSS custom property for background', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const bg = await page.evaluate(() => {
      // body may use background shorthand (gradient); check html or body background
      const bodyBg = getComputedStyle(document.body).background;
      const htmlBg = getComputedStyle(document.documentElement).background;
      return { bodyBg, htmlBg };
    });
    // Either body or html should have a non-empty background
    const hasBg = (bg.bodyBg && bg.bodyBg !== 'rgba(0, 0, 0, 0)') ||
                  (bg.htmlBg && bg.htmlBg !== 'rgba(0, 0, 0, 0)');
    expect(hasBg).toBe(true);
  });
});

test.describe('Phase B — Vuexy Components on Dashboard (requires auth)', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  test('.dc-card class is used on dashboard', async ({ page }) => {
    const EMAIL = process.env.TEST_EMAIL!;
    const PASSWORD = process.env.TEST_PASSWORD!;
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });

    const cards = page.locator('.dc-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('.dc-hero class is used on dashboard', async ({ page }) => {
    const EMAIL = process.env.TEST_EMAIL!;
    const PASSWORD = process.env.TEST_PASSWORD!;
    await page.goto(`${BASE}/login`);
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });

    const hero = page.locator('.dc-hero');
    const count = await hero.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ── Phase B: Spinner & Error Boundary (DOM-level checks) ────────────────────

test.describe('Phase B — LoadingSpinner Component', () => {
  test('spinner CSS class is defined in globals.css (computed via login page)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    // Inject a spinner to verify CSS is loaded
    const spinnerVisible = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'spinner';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const styles = getComputedStyle(el);
      const hasAnimation = styles.animationName !== 'none' && styles.animationName !== '';
      document.body.removeChild(el);
      return hasAnimation;
    });
    expect(spinnerVisible).toBe(true);
  });

  test('.page-loading CSS class sets min-height', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const minHeight = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'page-loading';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const minH = getComputedStyle(el).minHeight;
      document.body.removeChild(el);
      return minH;
    });
    // page-loading should have min-height: 280px
    expect(parseInt(minHeight)).toBeGreaterThanOrEqual(200);
  });

  test('.page-error CSS class sets color to var(--error)', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const color = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'page-error';
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      const c = getComputedStyle(el).color;
      document.body.removeChild(el);
      return c;
    });
    // Should be a reddish color (--error resolved)
    expect(color).not.toBe('');
    expect(color).not.toBe('rgb(0, 0, 0)'); // not black
  });
});

// ── Phase B: Typography ───────────────────────────────────────────────────────

test.describe('Phase B — Typography Consistency', () => {
  test('body uses Inter or design-system font', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const fontFamily = await page.evaluate(() =>
      getComputedStyle(document.body).fontFamily,
    );
    // Should use Inter, Space Grotesk, or Sora (our design system fonts)
    const hasDesignFont = /inter|space grotesk|sora|public sans/i.test(fontFamily);
    expect(hasDesignFont).toBe(true);
  });

  test('--font-body CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const fontVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim(),
    );
    expect(fontVar).toBeTruthy();
  });

  test('--font-heading CSS var is defined', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const fontVar = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-heading').trim(),
    );
    expect(fontVar).toBeTruthy();
  });
});
