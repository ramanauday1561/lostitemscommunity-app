import { test, expect } from '@playwright/test';
import { loginAs, logout, isLoggedIn, takeScreenshot, TEST_USERS } from './helpers';

test.describe('Phase 1: Authentication', () => {
  test('should load welcome screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Welcome to Lost Items Community')).toBeVisible();
    await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible();

    await takeScreenshot(page, 'phase1-welcome-screen');
  });

  test('should login as superadmin', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);

    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    await takeScreenshot(page, 'phase1-superadmin-dashboard');
  });

  test('should login as regular user', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    await takeScreenshot(page, 'phase1-regular-user-dashboard');
  });

  test('should logout', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    let loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    await logout(page);

    // Wait for navigation back to welcome
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'phase1-logout-complete');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByText('Sign in', { exact: true }).first().click();
    await page.getByPlaceholder('Username or email').fill('no_such_user_e2e');
    await page.getByPlaceholder('Password').fill('definitely-wrong-password');
    await page.keyboard.press('Enter');

    await expect(page.getByText('Invalid username/email or password.')).toBeVisible({ timeout: 20000 });
    await takeScreenshot(page, 'phase1-invalid-credentials');
  });
});
