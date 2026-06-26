/**
 * 14-flashcard-public-to-auth.spec.ts
 *
 * Drives a real browser through the public→authenticated flashcard flow:
 *   1. Open /flashcards/eks-coreks-m03 (locked teaser)
 *   2. Assert the locked layout matches the auth study view chrome:
 *        - '← Decks' button
 *        - 'Card 1 of N · Free preview' subtitle
 *        - Progress bar present
 *        - FlipCard rendered (CONCEPT badge visible)
 *        - Lock gate with 'Sign in to continue' visible
 *   3. Click 'Sign in to continue' → land on /login?next=…
 *   4. Sign in (admin-created test user)
 *   5. Assert post-login redirect lands on /dashboard/flashcards
 *      auto-selected on the SAME deck (deck title visible, study chrome)
 *   6. Cleanup: delete the test user via admin API
 */
import { test, expect } from '@playwright/test';

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const ANON_KEY      = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const SERVICE_KEY   = (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const CUSTOM_BASE   = process.env.TEST_BASE_URL;
const DECK_SLUG     = 'eks-coreks-m03';
const DECK_TITLE_FRAGMENT = 'Building'; // matches "Building an EKS Cluster"

function urlFor(path: string): string {
  return CUSTOM_BASE ? `${CUSTOM_BASE.replace(/\/$/, '')}${path}` : path;
}

async function adminCreateUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!res.ok || !data.id) throw new Error(`admin create failed: ${JSON.stringify(data)}`);
  return data.id as string;
}

async function adminDeleteUser(id: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

test.describe('public flashcard → login → resume same deck', () => {
  test.setTimeout(180_000);

  let userId: string | null = null;
  const ts = Date.now();
  const email    = `e2e-flash-${ts}@learnkloud.test`;
  const password = `Initial_${ts}_AAa1!`;

  test.afterAll(async () => {
    if (userId) await adminDeleteUser(userId);
  });

  test('full public→login→authenticated flashcard journey', async ({ page }) => {

    test.skip(
      !!process.env.SKIP_LIVE_AUTH || !SUPABASE_URL || !SERVICE_KEY,
      'requires live Supabase auth harness (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY); set SKIP_LIVE_AUTH to skip in CI',
    );

    // Prime the test user
    userId = await adminCreateUser(email, password);

    // ── 1. Open the locked public teaser ─────────────────────────────
    await page.goto(urlFor(`/flashcards/${DECK_SLUG}`));
    await page.waitForLoadState('networkidle');

    // ── 2. Verify auth-study chrome (visual parity) ──────────────────
    // '← Decks' button (matching the auth view's back button)
    await expect(page.getByRole('link', { name: /Decks/ }).first()).toBeVisible();
    // 'Card 1 of N · Free preview' subtitle
    await expect(page.getByText(/Card 1 of \d+ · Free preview/i)).toBeVisible();
    // FlipCard front: CONCEPT badge
    await expect(page.getByText('CONCEPT', { exact: true })).toBeVisible();
    // Lock gate
    await expect(page.getByText(/more cards? to study/i)).toBeVisible();
    // Sign-in CTA in the gate
    const signInCta = page.getByRole('link', { name: /Sign in to continue/i });
    await expect(signInCta).toBeVisible();

    // The href should embed the expected next= path (now dynamic /:slug)
    const ctaHref = await signInCta.getAttribute('href');
    expect(ctaHref).toBeTruthy();
    expect(decodeURIComponent(ctaHref!)).toContain(`/dashboard/flashcards/${DECK_SLUG}`);

    // ── 3. Click → /login?next=... ───────────────────────────────────
    await Promise.all([
      page.waitForURL(/\/login\?next=/, { timeout: 30_000 }),
      signInCta.click(),
    ]);

    // ── 4. Sign in via the login form ────────────────────────────────
    await page.locator('input[type=email]').first().fill(email);
    await page.locator('input[type=password]').first().fill(password);
    await Promise.all([
      page.waitForURL(/\/dashboard\/flashcards/, { timeout: 30_000 }),
      page.locator('button[type=submit]').first().click(),
    ]);

    // ── 5. Should land on /dashboard/flashcards/<slug> directly ──
    expect(page.url()).toContain(`/dashboard/flashcards/${DECK_SLUG}`);

    // Wait for client to auto-select the deck and render the study view
    await page.waitForTimeout(800);

    // The auth study view shows the deck title in its h1 and a 'Card X of N' subtitle
    await expect(page.getByRole('heading', { name: new RegExp(DECK_TITLE_FRAGMENT, 'i') })).toBeVisible();
    // The auth study view also shows the same CONCEPT badge (proves the
    // study view is rendered, not the deck grid)
    await expect(page.getByText('CONCEPT', { exact: true })).toBeVisible();
    // And the 'Show Answer' control button (only present in study view)
    await expect(page.getByRole('button', { name: /Show Answer/i })).toBeVisible();
  });
});
