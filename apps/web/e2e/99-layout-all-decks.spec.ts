/**
 * Full-pack layout verification — completes every flashcard deck end-to-end.
 * Verifies finish screen renders cleanly for all 6 decks (107 total cards),
 * no deck-grid bleed, and correct scroll-to-top on navigation.
 */
import { test, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_EMAIL    ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const SKIP     = !EMAIL || !PASSWORD;
const BASE     = 'http://localhost:8080';

const DECKS = [
  { title: 'AWS Core Services',          cards: 20 },
  { title: 'Cloud Security & IAM',       cards: 18 },
  { title: 'Cloud Pricing & Billing',    cards: 15 },
  { title: 'GenAI & Machine Learning',   cards: 20 },
  { title: 'Well-Architected Framework', cards: 16 },
  { title: 'CLF-C02 Exam Domains',       cards: 18 },
];

test.describe('All-decks layout verification', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD');
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    // Login once before each deck run
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 15_000 });
  });

  for (const deck of DECKS) {
    test(`${deck.title} (${deck.cards} cards) — finish screen clean, no bleed`, async ({ page }) => {
      // Clear this deck's localStorage
      await page.goto(`${BASE}/dashboard/flashcards`);
      await page.waitForLoadState('networkidle');
      await page.evaluate((title) => {
        // Clear all flashcard storage for a clean run
        Object.keys(localStorage)
          .filter((k) => k.startsWith('flashcards-known-'))
          .forEach((k) => localStorage.removeItem(k));
      }, deck.title);

      // Open the deck
      await page.locator('.card-title', { hasText: deck.title }).first().click();
      await page.waitForTimeout(400);

      // Verify we're on card 1
      await expect(page.getByText(`Card 1 of ${deck.cards}`)).toBeVisible({ timeout: 5000 });

      // Mark every card as Knew it
      for (let i = 0; i < deck.cards; i++) {
        await page.getByRole('button', { name: /Knew it/i }).click();
        await page.waitForTimeout(250);
      }

      // Finish screen must appear
      await expect(page.getByText('All Cards Mastered!')).toBeVisible({ timeout: 4000 });

      // Stat: all cards known
      await expect(page.locator('.dash-stat-card').first().getByText(String(deck.cards))).toBeVisible();

      // Screenshot: finish screen top
      await page.screenshot({ path: `test-results/all-decks-finish-${deck.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png` });

      // Scroll finish screen to absolute bottom
      await page.evaluate(() => {
        const el = document.querySelector('.main-content');
        if (el) el.scrollTop = el.scrollHeight;
      });
      await page.waitForTimeout(200);

      // KEY: deck-grid heading must NOT be visible anywhere on the finish screen
      await expect(page.locator('.page-title', { hasText: 'Flashcards' })).not.toBeVisible();

      // Return to deck grid
      await page.getByRole('button', { name: /All Decks/i }).click();
      await page.waitForTimeout(400);

      // Deck grid at top, scroll = 0
      await expect(page.locator('.page-title', { hasText: 'Flashcards' })).toBeVisible();
      const scrollTop = await page.evaluate(() => document.querySelector('.main-content')?.scrollTop ?? 0);
      expect(scrollTop).toBe(0);
    });
  }
});
