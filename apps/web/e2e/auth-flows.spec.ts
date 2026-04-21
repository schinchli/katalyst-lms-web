/**
 * Auth flow E2E tests — run on every web change.
 * Uses Playwright. Run: npx playwright test e2e/auth-flows.spec.ts
 *
 * Covers: signup OTP, login, logout, route protection, password reset.
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const TEST_EMAIL = `qa+${Date.now()}@mailtest.katalyst.dev`;
const TEST_PASSWORD = 'TestPwd@1234!';

// ─────────────────────────────────────────────────────────────────────────────
// Route Protection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Route Protection (unauthenticated)', () => {
  test('TC-RP-01: /dashboard redirects to /login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-RP-02: /dashboard/quizzes redirects to /login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/quizzes`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-RP-03: /login preserves ?next= redirect destination', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/leaderboard`);
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fleaderboard/);
  });

  test('TC-RP-04: public pages accessible without login', async ({ page }) => {
    for (const path of ['/', '/login', '/signup', '/reset-password']) {
      await page.goto(`${BASE}${path}`);
      await expect(page).not.toHaveURL(/\/login.*next=/);
    }
  });

  test('TC-RP-05: /verify-email accessible without login', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('h4')).toContainText('Check your email');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Signup', () => {
  test('TC-SU-01: signup form renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await expect(page.locator('h4')).toContainText('Create an account');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('TC-SU-02: rejects password < 12 chars', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Short1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toContainText('12 characters');
  });

  test('TC-SU-03: rejects disposable email domains', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.fill('input[type="email"]', 'test@mailinator.com');
    await page.fill('input[type="password"]', 'ValidPwd@123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toContainText('Disposable');
  });

  test('TC-SU-04: weak password (no uppercase) rejected', async ({ page }) => {
    await page.goto(`${BASE}/signup`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'alllowercase123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toContainText('uppercase');
  });

  test('TC-SU-05: valid signup redirects to /verify-email', async ({ page }) => {
    // This test requires a real Supabase connection. Skip in unit mode.
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase');
    await page.goto(`${BASE}/signup`);
    await page.fill('input[placeholder="Jane Smith"]', 'Test User');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 10000 });
    await expect(page).toHaveURL(new RegExp(encodeURIComponent(TEST_EMAIL)));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verify Email (OTP)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Verify Email OTP', () => {
  test('TC-VE-01: renders 6 OTP input boxes', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    const inputs = page.locator('input[inputMode="numeric"]');
    await expect(inputs).toHaveCount(6);
  });

  test('TC-VE-02: paste fills all 6 boxes', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    const first = page.locator('input[inputMode="numeric"]').first();
    await first.click();
    await page.keyboard.insertText('123456');
    const inputs = page.locator('input[inputMode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await expect(inputs.nth(i)).toHaveValue(String(i + 1));
    }
  });

  test('TC-VE-03: submit disabled with incomplete code', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('TC-VE-04: submit enabled after full 6-digit entry', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    const first = page.locator('input[inputMode="numeric"]').first();
    await first.click();
    await page.keyboard.insertText('123456');
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('TC-VE-05: invalid OTP shows error message', async ({ page }) => {
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase');
    await page.goto(`${BASE}/verify-email?email=real@example.com`);
    const first = page.locator('input[inputMode="numeric"]').first();
    await first.click();
    await page.keyboard.insertText('000000');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toBeVisible({ timeout: 8000 });
  });

  test('TC-VE-06: resend code button is visible', async ({ page }) => {
    await page.goto(`${BASE}/verify-email?email=test@example.com`);
    await expect(page.locator('button', { hasText: 'Resend code' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('TC-LI-01: login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('h4')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('TC-LI-02: wrong credentials shows error', async ({ page }) => {
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase');
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'nobody@example.com');
    await page.fill('input[type="password"]', 'WrongPass@99!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toBeVisible({ timeout: 8000 });
  });

  test('TC-LI-03: ?reset=success shows password reset banner', async ({ page }) => {
    await page.goto(`${BASE}/login?reset=success`);
    await expect(page.locator('text=Password updated successfully')).toBeVisible();
  });

  test('TC-LI-04: ?verified=1 shows email verified banner', async ({ page }) => {
    await page.goto(`${BASE}/login?verified=1`);
    await expect(page.locator('text=Email verified')).toBeVisible();
  });

  test('TC-LI-05: links to signup and forgot password present', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
    await expect(page.locator('a[href="/reset-password"]')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated user — route protection
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Route Protection (authenticated)', () => {
  test('TC-AU-01: authenticated user visiting /login redirects to /dashboard', async ({ browser }) => {
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase session');
    // This test requires a pre-seeded auth cookie — run with stored session state
    const context = await browser.newContext({ storageState: 'e2e/auth-state.json' });
    const page = await context.newPage();
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    await context.close();
  });

  test('TC-AU-02: authenticated user visiting /signup redirects to /dashboard', async ({ browser }) => {
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase session');
    const context = await browser.newContext({ storageState: 'e2e/auth-state.json' });
    const page = await context.newPage();
    await page.goto(`${BASE}/signup`);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
    await context.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Password Reset
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Password Reset', () => {
  test('TC-PR-01: reset page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/reset-password`);
    await expect(page.locator('h4')).toContainText('Forgot Password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('TC-PR-02: submitting shows check-inbox state', async ({ page }) => {
    test.skip(!!process.env.SKIP_LIVE_AUTH, 'Requires live Supabase');
    await page.goto(`${BASE}/reset-password`);
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    await expect(page.locator('h4')).toContainText('Check your inbox', { timeout: 8000 });
  });

  test('TC-PR-03: update-password rejects weak passwords', async ({ page }) => {
    await page.goto(`${BASE}/update-password`);
    const inputs = page.locator('input[type="password"]');
    await inputs.first().fill('weak');
    await inputs.last().fill('weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toContainText('12 characters');
  });

  test('TC-PR-04: update-password rejects mismatched passwords', async ({ page }) => {
    await page.goto(`${BASE}/update-password`);
    const inputs = page.locator('input[type="password"]');
    await inputs.first().fill('ValidPwd@123!');
    await inputs.last().fill('DifferentPwd@123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('[style*="error"]')).toContainText('do not match');
  });
});
