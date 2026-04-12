/**
 * Flashcard feature tests — full coverage
 *
 * Covers:
 *  1. Deck grid loads
 *  2. Enter deck, see first card
 *  3. Flip card (click + button)
 *  4. "Knew it" advances card, increments known counter
 *  5. "Review later" advances card, does NOT increment known counter
 *  6. "← Prev" navigates back
 *  7. Keyboard shortcuts: Space (flip), K (knew), S (skip), →←
 *  8. Finish screen: correct counts, "Knew it" list, "Need review" list
 *  9. "undo" on a known card → moves to "Need review", counts update live
 * 10. "↻ Review N cards" → only review cards shown, round label in header
 * 11. Completing review round shows finish screen again
 * 12. localStorage persistence: reopen deck → known cards excluded from queue
 * 13. All cards pre-known → "All Cards Mastered!" on mount
 * 14. "Restart deck" clears everything
 *
 * Run: TEST_EMAIL=x@y.com TEST_PASSWORD=secret npx playwright test 11-flashcards
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';

const EMAIL    = process.env.TEST_EMAIL    ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const SKIP     = !EMAIL || !PASSWORD;
const BASE     = 'http://localhost:8080';

// Deck we test against — first deck, 20 cards, IDs "1"–"20"
const DECK_TITLE  = 'AWS Core Services';
const DECK_ID     = 'aws-core-services';
const CARD_1_FRONT = 'Amazon EC2';
const CARD_2_FRONT = 'Amazon S3';
const CARD_3_FRONT = 'Amazon RDS';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 12000 });
}

/** Clear all flashcard-related localStorage for a clean slate */
async function clearFlashcardStorage(page: Page) {
  await page.evaluate((deckId: string) => {
    localStorage.removeItem(`flashcards-known-${deckId}`);
  }, DECK_ID);
}

/** Seed known card IDs directly into localStorage */
async function seedKnown(page: Page, ids: string[]) {
  await page.evaluate(
    ({ deckId, ids }: { deckId: string; ids: string[] }) => {
      localStorage.setItem(`flashcards-known-${deckId}`, JSON.stringify(ids));
    },
    { deckId: DECK_ID, ids },
  );
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Flashcards', () => {
  test.skip(SKIP, 'Requires TEST_EMAIL + TEST_PASSWORD env vars');

  let ctx:  BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    ctx  = await browser.newContext();
    page = await ctx.newPage();
    await login(page);
  });

  test.afterAll(() => ctx.close());

  // ── 1. Deck grid ─────────────────────────────────────────────────────────

  test('deck grid loads with expected decks', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
    await expect(page.getByText(DECK_TITLE)).toBeVisible();
    await expect(page.getByText('Cloud Security & IAM')).toBeVisible();
  });

  // ── 2. Enter deck, see first card ────────────────────────────────────────

  test('entering a deck shows the first card', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');

    await page.getByText(DECK_TITLE).click();
    await page.waitForLoadState('networkidle');

    // Header
    await expect(page.getByRole('heading', { name: DECK_TITLE })).toBeVisible();
    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();
    await expect(page.getByText(/0 known/)).toBeVisible();

    // First card front is visible
    await expect(page.getByText(CARD_1_FRONT)).toBeVisible();
    await expect(page.getByText('Click to reveal answer')).toBeVisible();
  });

  // ── 3. Flip card ─────────────────────────────────────────────────────────

  test('clicking "Show Answer" button reveals the card back', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.getByRole('button', { name: 'Show Answer' }).click();
    await expect(page.getByRole('button', { name: 'Hide Answer' })).toBeVisible();
    // Back content contains EC2 description
    await expect(page.getByText(/Elastic Compute Cloud/)).toBeVisible();
  });

  test('clicking the card itself flips it', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    // Click the card area (perspective container)
    const cardArea = page.locator('[style*="perspective"]').first();
    await cardArea.click();
    await expect(page.getByRole('button', { name: 'Hide Answer' })).toBeVisible();
  });

  // ── 4. "Knew it" ─────────────────────────────────────────────────────────

  test('"Knew it" advances to next card and increments known counter', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();
    await expect(page.getByText(/0 known/)).toBeVisible();

    await page.getByRole('button', { name: /Knew it/i }).click();

    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();
    await expect(page.getByText(/1 known/)).toBeVisible();
    await expect(page.getByText(CARD_2_FRONT)).toBeVisible();
  });

  test('"Knew it" persists known ID to localStorage', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.getByRole('button', { name: /Knew it/i }).click();

    const stored = await page.evaluate((deckId: string) => {
      const raw = localStorage.getItem(`flashcards-known-${deckId}`);
      return raw ? JSON.parse(raw) : [];
    }, DECK_ID);

    expect(stored).toContain('1'); // card ID "1" = Amazon EC2
  });

  // ── 5. "Review later" ────────────────────────────────────────────────────

  test('"Review later" advances to next card without incrementing known', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.getByRole('button', { name: /Review later/i }).click();

    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();
    await expect(page.getByText(/0 known/)).toBeVisible(); // still 0
    await expect(page.getByText(CARD_2_FRONT)).toBeVisible();
  });

  // ── 6. Prev navigation ───────────────────────────────────────────────────

  test('"← Prev" navigates to previous card', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await btnNext().click();
    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();

    await btnPrev().click();
    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();
    await expect(page.getByText(CARD_1_FRONT)).toBeVisible();
  });

  test('"← Prev" is disabled on the first card', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await expect(btnPrev()).toBeDisabled();
  });

  // ── 7. Keyboard shortcuts ────────────────────────────────────────────────

  test('Space key flips the card', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Hide Answer' })).toBeVisible();
  });

  test('K key marks as known and advances', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.keyboard.press('k');
    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();
    await expect(page.getByText(/1 known/)).toBeVisible();
  });

  test('S key marks as review later and advances', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.keyboard.press('s');
    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();
    await expect(page.getByText(/0 known/)).toBeVisible();
  });

  test('Arrow keys navigate between cards', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.keyboard.press('ArrowRight');
    await expect(page.getByText(/Card 2 of 20/)).toBeVisible();

    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();
  });

  // ── 8. Finish screen ─────────────────────────────────────────────────────

  /**
   * Helper: mark cards 1–3 known, card 4 as skip, then advance through
   * remaining 16 cards with Next to reach the finish screen quickly.
   */
  // Stable selectors — avoid matching Next.js Dev Tools button (/Next/i is ambiguous)
  const btnNext  = () => page.locator('button').filter({ hasText: 'Next →' });
  const btnPrev  = () => page.locator('button').filter({ hasText: '← Prev' });

  async function reachFinishScreen() {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    // Mark cards 1, 2, 3 as "Knew it"
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Knew it/i }).click();
      await page.waitForTimeout(200);
    }
    // Mark card 4 as "Review later"
    await page.getByRole('button', { name: /Review later/i }).click();
    await page.waitForTimeout(200);

    // Advance through remaining 16 cards (indices 4→19, then 20 triggers finish)
    // index 4 → click 16 times → advance(20) → setFinished(true)
    for (let i = 0; i < 16; i++) {
      await btnNext().click();
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(300);
  }

  test('finish screen shows correct known + review counts', async () => {
    await reachFinishScreen();

    await expect(page.getByText(/Round 1 Complete|Deck Complete/i)).toBeVisible();
    // known count box = 3
    const knownBox = page.locator('div').filter({ hasText: /^3$/ }).first();
    await expect(knownBox).toBeVisible();
    // review count box = 1
    const reviewBox = page.locator('div').filter({ hasText: /^1$/ }).first();
    await expect(reviewBox).toBeVisible();
  });

  test('finish screen lists "Knew it" cards by name', async () => {
    await reachFinishScreen();

    await expect(page.getByText(/Knew it \(3\)/i)).toBeVisible();
    await expect(page.getByText(CARD_1_FRONT)).toBeVisible(); // EC2
    await expect(page.getByText(CARD_2_FRONT)).toBeVisible(); // S3
    await expect(page.getByText(CARD_3_FRONT)).toBeVisible(); // RDS
  });

  test('finish screen lists "Need review" cards with full answer', async () => {
    await reachFinishScreen();

    await expect(page.getByText(/Need review \(1\)/i)).toBeVisible();
    // Card 4 = Amazon Lambda front
    await expect(page.getByText('AWS Lambda')).toBeVisible();
    // Its back text should also be visible in the review list
    await expect(page.getByText(/Serverless compute service/i)).toBeVisible();
  });

  test('each "Knew it" card shows an "undo" button', async () => {
    await reachFinishScreen();

    const undoBtns = page.getByRole('button', { name: 'undo' });
    await expect(undoBtns).toHaveCount(3);
  });

  // ── 9. Undo known card ───────────────────────────────────────────────────

  test('"undo" moves a known card to "Need review" and updates counts live', async () => {
    await reachFinishScreen();

    // Before undo: known=3, review=1
    await expect(page.getByText(/Knew it \(3\)/i)).toBeVisible();
    await expect(page.getByText(/Need review \(1\)/i)).toBeVisible();

    // Undo the first "Knew it" card (Amazon EC2)
    const undoBtns = page.getByRole('button', { name: 'undo' });
    await undoBtns.first().click();

    // After undo: known=2, review=2
    await expect(page.getByText(/Knew it \(2\)/i)).toBeVisible();
    await expect(page.getByText(/Need review \(2\)/i)).toBeVisible();

    // EC2 is now in "Need review" — it has no "undo" button (only known cards do)
    // The "Knew it" section should only have 2 undo buttons now (was 3)
    await expect(page.getByRole('button', { name: 'undo' })).toHaveCount(2);
  });

  test('"undo" updates the localStorage known set', async () => {
    await reachFinishScreen();

    const before = await page.evaluate((deckId: string) => {
      const raw = localStorage.getItem(`flashcards-known-${deckId}`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    }, DECK_ID);
    expect(before).toContain('1'); // EC2

    await page.getByRole('button', { name: 'undo' }).first().click();

    const after = await page.evaluate((deckId: string) => {
      const raw = localStorage.getItem(`flashcards-known-${deckId}`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    }, DECK_ID);
    expect(after).not.toContain('1'); // EC2 removed
  });

  test('"↻ Review N cards" button count updates after undo', async () => {
    await reachFinishScreen();
    // Initially 1 review card
    await expect(page.getByRole('button', { name: /Review 1 card/i })).toBeVisible();

    await page.getByRole('button', { name: 'undo' }).first().click();
    // Now 2 review cards
    await expect(page.getByRole('button', { name: /Review 2 cards/i })).toBeVisible();
  });

  // ── 10. Review round ─────────────────────────────────────────────────────

  test('review round shows only "Review later" cards — not known ones', async () => {
    await reachFinishScreen();
    // Start review (1 card: AWS Lambda)
    await page.getByRole('button', { name: /Review 1 card/i }).click();
    await page.waitForTimeout(200);

    // Header should say Round 2
    await expect(page.getByText(/Review round 2/i)).toBeVisible();
    await expect(page.getByText(/Card 1 of 1/)).toBeVisible();

    // The card shown should be AWS Lambda (the skipped card)
    await expect(page.getByText('AWS Lambda')).toBeVisible();

    // The known cards (EC2, S3, RDS) must NOT appear as the active card
    await expect(page.getByText(CARD_1_FRONT)).not.toBeVisible();
    await expect(page.getByText(CARD_2_FRONT)).not.toBeVisible();
    await expect(page.getByText(CARD_3_FRONT)).not.toBeVisible();
  });

  test('review round header shows correct round number', async () => {
    await reachFinishScreen();
    await page.getByRole('button', { name: /Review 1 card/i }).click();
    await expect(page.getByText(/Review round 2/i)).toBeVisible();
  });

  test('completing review round shows finish screen again', async () => {
    await reachFinishScreen();
    await page.getByRole('button', { name: /Review 1 card/i }).click();
    await page.waitForTimeout(200);

    // Mark the review card as known to complete the round
    await page.getByRole('button', { name: /Knew it/i }).click();
    await page.waitForTimeout(300);

    // Should now show "All Cards Mastered!" since all are known/none left to review
    await expect(page.getByText(/All Cards Mastered|Round 2 Complete/i)).toBeVisible();
  });

  test('after review round marks all known, no "↻ Review" button appears', async () => {
    await reachFinishScreen();
    await page.getByRole('button', { name: /Review 1 card/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /Knew it/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('button', { name: /Review \d+ card/i })).not.toBeVisible();
  });

  // ── 11. localStorage persistence ─────────────────────────────────────────

  test('reopening a deck skips previously-known cards', async () => {
    // Seed card "1" (EC2) and "2" (S3) as already known
    await page.goto(`${BASE}/dashboard/flashcards`);
    await clearFlashcardStorage(page);
    await seedKnown(page, ['1', '2']);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();
    await page.waitForLoadState('networkidle');

    // First card shown should be card 3 (Amazon RDS), not EC2 or S3
    await expect(page.getByText(CARD_3_FRONT)).toBeVisible();
    await expect(page.getByText(CARD_1_FRONT)).not.toBeVisible();
    await expect(page.getByText(CARD_2_FRONT)).not.toBeVisible();

    // Queue = 18 cards (20 minus 2 known), known count = 2
    await expect(page.getByText(/Card 1 of 18/)).toBeVisible();
    await expect(page.getByText(/2 known/)).toBeVisible();
  });

  // ── 12. All cards known → finish screen on mount ──────────────────────────

  test('if all cards are already known, finish screen shows immediately', async () => {
    await page.goto(`${BASE}/dashboard/flashcards`);
    await clearFlashcardStorage(page);
    // Seed all 20 card IDs as known
    const allIds = Array.from({ length: 20 }, (_, i) => String(i + 1));
    await seedKnown(page, allIds);

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();
    await page.waitForTimeout(300);

    await expect(page.getByText(/All Cards Mastered/i)).toBeVisible();
    // All 20 listed in "Knew it"
    await expect(page.getByText(/Knew it \(20\)/i)).toBeVisible();
    // No "Review" button
    await expect(page.getByRole('button', { name: /Review \d+ card/i })).not.toBeVisible();
  });

  // ── 13. Restart deck ─────────────────────────────────────────────────────

  test('"Restart deck" resets all state and localStorage', async () => {
    await reachFinishScreen();

    await page.getByRole('button', { name: 'Restart deck' }).click();
    await page.waitForTimeout(200);

    // Should be back to card 1 of 20, 0 known
    await expect(page.getByText(/Card 1 of 20/)).toBeVisible();
    await expect(page.getByText(/0 known/)).toBeVisible();
    await expect(page.getByText(CARD_1_FRONT)).toBeVisible();

    // localStorage should be empty
    const stored = await page.evaluate((deckId: string) => {
      return localStorage.getItem(`flashcards-known-${deckId}`);
    }, DECK_ID);
    expect(stored).toBeNull();
  });

  // ── 14. Back navigation ───────────────────────────────────────────────────

  test('"← Decks" button returns to deck grid', async () => {
    await clearFlashcardStorage(page);
    await page.goto(`${BASE}/dashboard/flashcards`);
    await page.waitForLoadState('networkidle');
    await page.getByText(DECK_TITLE).click();

    await page.getByRole('button', { name: /Decks/i }).click();
    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
    await expect(page.getByText(DECK_TITLE)).toBeVisible();
  });

  test('"All Decks" button on finish screen returns to deck grid', async () => {
    await reachFinishScreen();
    await page.getByRole('button', { name: 'All Decks' }).click();
    await expect(page.getByRole('heading', { name: 'Flashcards' })).toBeVisible();
  });
});
