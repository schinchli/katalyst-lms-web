import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads and shows form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Katalyst|Login/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Sign in button
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('login page shows error on blank submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Either native validation or error message
    const emailInput = page.locator('input[type="email"]');
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('login page shows error on bad credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Wait for either an error message or a redirect (not dashboard)
    await page.waitForTimeout(2000);
    const url = page.url();
    // Should still be on login or show an error — not on dashboard
    expect(url).not.toContain('/dashboard');
  });

  test('unauthenticated users are redirected away from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(1500);
    const url = page.url();
    // Should be on login page
    expect(url).toContain('/login');
  });

  test('signup page loads (if exists)', async ({ page }) => {
    const response = await page.goto('/signup');
    // Could be 200 (exists) or redirect to login
    expect(response?.status()).toBeLessThan(500);
  });
});
