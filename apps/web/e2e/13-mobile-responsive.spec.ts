/**
 * 13-mobile-responsive.spec.ts
 *
 * Mobile-friendly audit: renders the main public + dashboard pages at
 * iPhone-class (375x812) and tablet (768x1024) widths, screenshots them,
 * and flags any horizontal scroll (a strong indicator of overflow).
 *
 * Does NOT log in — dashboard pages should 307-redirect to /login, which
 * itself must be mobile-friendly. Public pages render in full.
 *
 * Run locally:  TEST_BASE_URL=https://learnkloud.today npx playwright test 13-mobile-responsive
 * CI runs it against http://localhost:8080 (playwright config baseURL).
 */
import { test, expect, type Page } from '@playwright/test';

const CUSTOM_BASE = process.env.TEST_BASE_URL;
function urlFor(path: string): string {
  return CUSTOM_BASE ? `${CUSTOM_BASE.replace(/\/$/, '')}${path}` : path;
}

const VIEWPORTS = [
  { name: 'iphone-portrait', width: 375, height: 812 },
  { name: 'ipad-portrait',   width: 768, height: 1024 },
] as const;

const PAGES = [
  { path: '/',                            label: 'home' },
  { path: '/flashcards',                  label: 'flashcards-index' },
  { path: '/flashcards/eks-coreks-m01',   label: 'flashcards-deck' },
  { path: '/login',                       label: 'login' },
  { path: '/signup',                      label: 'signup' },
  { path: '/about',                       label: 'about' },
  { path: '/reset-password',              label: 'reset-password' },
] as const;

async function hasHorizontalScroll(page: Page): Promise<boolean> {
  // The Google reCAPTCHA badge is an overlay iframe Google injects off-screen
  // and it can't be styled out. Detach it before measuring so our overflow
  // signal isn't poisoned by a third-party widget.
  await page.evaluate(() => {
    document.querySelectorAll('.grecaptcha-badge').forEach((el) => el.remove());
  });
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;
    // 2px tolerance for sub-pixel rounding
    return scrollWidth > clientWidth + 2;
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`mobile audit — ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const target of PAGES) {
      test(`${target.label} (${target.path}) renders without horizontal overflow`, async ({ page }) => {
        await page.goto(urlFor(target.path), { waitUntil: 'domcontentloaded' });
        // Allow client hydration a moment
        await page.waitForTimeout(500);

        const overflows = await hasHorizontalScroll(page);

        if (overflows) {
          console.warn(
            `[mobile-audit] HORIZONTAL OVERFLOW on ${target.label} @ ${viewport.name}`,
          );
        }

        expect(
          overflows,
          `${target.label} should fit in ${viewport.width}px wide viewport`,
        ).toBe(false);
      });
    }
  });
}
