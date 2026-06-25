/**
 * 12-password-reset-flow.spec.ts
 *
 * Drives a real browser through the production password-reset UI:
 *   1. Admin-create a fresh test user via Supabase Admin API (auto-confirmed)
 *   2. Verify initial-password sign-in works (sanity)
 *   3. Generate a recovery OTP via Admin API (gives us the code that would
 *      land in the user's inbox)
 *   4. Open /reset-password/verify in Chromium, fill email + OTP + new pw
 *   5. Submit and assert redirect to /login?reset=success
 *   6. Sign in with the new password via the login page
 *   7. Assert dashboard renders
 *   8. Cleanup: delete the test user
 *
 * Required env (passed via the spawn or .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Test skips gracefully if SUPABASE_SERVICE_ROLE_KEY is absent (e.g. contributor
 * local without the secret). Defaults to the playwright config baseURL
 * (localhost:8080 in CI); set TEST_BASE_URL=https://learnkloud.today to point
 * at production manually.
 */
import { test, expect, type Page } from '@playwright/test';

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const ANON_KEY      = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const SERVICE_KEY   = (process.env.SUPABASE_SERVICE_ROLE_KEY  ?? '').replace(/\\n$/, '').replace(/^"|"$/g, '');
const CUSTOM_BASE   = process.env.TEST_BASE_URL;

function urlFor(path: string): string {
  return CUSTOM_BASE ? `${CUSTOM_BASE.replace(/\/$/, '')}${path}` : path;
}

interface CreatedUser { id: string; email: string }
interface AdminGenLink {
  email_otp?: string;
  properties?: { email_otp?: string };
}

async function adminCreateUser(email: string, password: string): Promise<CreatedUser> {
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
  return { id: data.id as string, email };
}

async function adminDeleteUser(id: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

async function adminGenerateRecoveryOtp(email: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'recovery', email }),
  });
  const data = (await res.json()) as AdminGenLink;
  const otp = data.email_otp ?? data.properties?.email_otp;
  if (!otp) throw new Error(`generate_link returned no OTP: ${JSON.stringify(data)}`);
  return otp;
}

async function signInViaApi(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.access_token ?? null;
}

async function dumpOnFail(page: Page, label: string) {
  const html = await page.content();
  console.error(`[${label}] URL = ${page.url()}`);
  console.error(`[${label}] HTML head = ${html.slice(0, 600)}`);
}

test.describe('Password reset — full UI flow', () => {
  test.setTimeout(180_000);

  let user: CreatedUser | null = null;
  const ts = Date.now();
  const email     = `e2e-reset-${ts}@learnkloud.test`;
  const initialPw = `Initial_${ts}_AAa1!`;
  const newPw     = `NewSecure_${ts}_BBb2@`;

  test.afterAll(async () => {
    if (user) {
      console.log(`[cleanup] deleting test user ${user.email}`);
      await adminDeleteUser(user.id);
    }
  });

  test('verify OTP-based password reset works end-to-end', async ({ page }) => {

    test.skip(
      !!process.env.SKIP_LIVE_AUTH || !SUPABASE_URL || !SERVICE_KEY,
      'requires live Supabase auth harness (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY); set SKIP_LIVE_AUTH to skip in CI',
    );

    // ── 1. Create user via admin API (auto-confirmed email) ────────────
    console.log(`[1] admin-create user ${email}`);
    user = await adminCreateUser(email, initialPw);

    // ── 2. Sanity: initial password works ──────────────────────────────
    console.log('[2] sanity sign-in with initial password');
    const t1 = await signInViaApi(email, initialPw);
    expect(t1, 'initial password should authenticate').toBeTruthy();

    // ── 3. Generate recovery OTP via admin API (this is what the real
    //      email would contain) ──────────────────────────────────────────
    console.log('[3] admin generate_link → recovery OTP');
    const otp = await adminGenerateRecoveryOtp(email);
    console.log(`    OTP=${otp}`);
    expect(otp).toMatch(/^\d{6}$/);

    // ── 4. Drive the /reset-password/verify page in the real browser ───
    const verifyPath = `/reset-password/verify?email=${encodeURIComponent(email)}`;
    console.log(`[4] navigate to ${urlFor(verifyPath)}`);
    await page.goto(urlFor(verifyPath));
    await page.waitForLoadState('networkidle');

    // Email should be pre-filled from the query param
    const emailInput = page.locator('#rpv-email');
    await expect(emailInput).toHaveValue(email);

    // Fill OTP + new password
    await page.locator('#rpv-otp').fill(otp);
    await page.locator('#rpv-pw').fill(newPw);
    await page.locator('#rpv-pw2').fill(newPw);

    // ── 5. Submit + assert redirect to /login?reset=success ────────────
    console.log('[5] submit form');
    await Promise.all([
      page.waitForURL(/\/login(\?reset=success)?$/, { timeout: 30_000 }),
      page.locator('button[type=submit]').click(),
    ]).catch(async (err) => {
      await dumpOnFail(page, 'after submit');
      throw err;
    });

    expect(page.url()).toMatch(/\/login\?reset=success/);
    console.log('    ✓ redirected to /login?reset=success');

    // ── 6. Sign in via login page with the new password ────────────────
    console.log('[6] sign in with new password via /login UI');

    // The login page input names depend on existing UI; cover both common shapes
    const loginEmail = page.locator('input[type=email]').first();
    const loginPw    = page.locator('input[type=password]').first();
    await loginEmail.fill(email);
    await loginPw.fill(newPw);

    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 30_000 }),
      page.locator('button[type=submit]').first().click(),
    ]).catch(async (err) => {
      await dumpOnFail(page, 'after login submit');
      throw err;
    });

    expect(page.url()).toContain('/dashboard');
    console.log('    ✓ dashboard reached — new password works end-to-end');

    // ── 7. Bonus: old password should now FAIL ─────────────────────────
    console.log('[7] confirm old password no longer works');
    const oldStillWorks = await signInViaApi(email, initialPw);
    expect(oldStillWorks, 'old password must be invalid after reset').toBeNull();
  });
});
