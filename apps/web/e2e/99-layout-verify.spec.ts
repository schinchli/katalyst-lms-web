/**
 * Layout verification — completes a full 20-card deck session and captures
 * screenshots proving no deck-grid bleed below the finish screen.
 *
 * Screenshots saved to test-results/ prefixed layout-NN-*.png
 */
import { test, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_EMAIL    ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const SKIP     = !EMAIL || !PASSWORD;
const BASE     = 'http://localhost:8080';

test.describe('Layout verification — full deck completion', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD');
  test.setTimeout(120_000);

  test('complete all 20 cards → finish screen has no deck-grid bleed', async ({ page }) => {
    // ── Login ──────────────────────────────────────────────────────────────
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });

    // ── Clear persisted state ──────────────────────────────────────────────
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('flashcards-known-'))
        .forEach((k) => localStorage.removeItem(k));
    });

    // ── Deck grid ──────────────────────────────────────────────────────────
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/layout-01-deck-grid.png' });

    // ── Open AWS Core Services ─────────────────────────────────────────────
    await page.getByText('AWS Core Services').click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/layout-02-card-1.png' });

    // Verify first card visible
    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();

    // ── Mark ALL 20 cards as Knew it ──────────────────────────────────────
    // Wait 250ms between clicks — the advance() callback has a 150ms setTimeout
    // inside, so we need ≥150ms gap for the next card to mount before clicking.
    for (let i = 0; i < 20; i++) {
      await page.getByRole('button', { name: /Knew it/i }).click();
      await page.waitForTimeout(250);
    }

    // ── Finish screen ──────────────────────────────────────────────────────
    // Wait up to 3s for the finish screen (last advance fires at 150ms)
    await expect(page.getByText('All Cards Mastered!')).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: 'test-results/layout-03-finish-top.png' });

    // Verify stat badge: 20 known (use the stat card value, not any occurrence of '20')
    const statCards = page.locator('.dash-stat-card');
    await expect(statCards.first().getByText('20')).toBeVisible();   // known
    await expect(page.getByText('Knew it (20)')).toBeVisible();       // list header

    // Scroll main-content to bottom — check nothing leaks below finish screen
    await page.evaluate(() => {
      const el = document.querySelector('.main-content');
      if (el) el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'test-results/layout-04-finish-scrolled.png' });

    // KEY ASSERTION: deck-grid heading must NOT be visible on the finish screen.
    // We check the page-title heading ("Flashcards") which is only in DeckGrid — not in StudyView.
    await expect(page.locator('.page-title', { hasText: 'Flashcards' })).not.toBeVisible();

    // No deck card with "Study now →" should be in the viewport
    const studyNowBtns = page.locator('.btn-start', { hasText: 'Study now' });
    for (const btn of await studyNowBtns.all()) {
      await expect(btn).not.toBeInViewport();
    }

    // ── Return to deck grid ────────────────────────────────────────────────
    await page.evaluate(() => {
      const el = document.querySelector('.main-content');
      if (el) el.scrollTop = 0;
    });
    await page.getByRole('button', { name: /All Decks/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'test-results/layout-05-back-grid.png' });

    // Deck grid should be at top (scroll = 0)
    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
    const scrollTop = await page.evaluate(() => document.querySelector('.main-content')?.scrollTop ?? 0);
    expect(scrollTop).toBe(0);

    // Deck titles visible from the top of the grid
    await expect(page.locator('.card-title', { hasText: 'AWS Core Services' }).first()).toBeVisible();
    await expect(page.locator('.card-title', { hasText: 'Cloud Pricing & Billing' }).first()).toBeVisible();
  });
});
