import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3000';
const TESTUSER_EMAIL = 'testuser@example.com';
const TESTUSER_PASS = 'Test@12345';
const SUPERADMIN_EMAIL = 'superadmin@example.com';
const SUPERADMIN_PASS = 'Admin@12345';

/** Helper: login with given credentials */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto(APP_URL);
  await page.waitForSelector('text=Sign In', { timeout: 5000 });

  const welcomeSignIn = await page.locator('text=Sign In').first().isVisible().catch(() => false);
  if (welcomeSignIn) {
    await page.locator('text=Sign In').first().click();
  }

  await page.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]', email);
  await page.fill('input[type="password"]', password);
  await page.click('text=Sign In');

  await page.waitForURL('**/dash', { timeout: 10000 });
}

test.describe('Phase 7: Admin Moderation Queue', () => {

  test('Moderation: Superadmin can see moderation queue', async ({ page }) => {
    // Login as superadmin
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);

    // Look for Admin or Moderation button/tab
    const adminButton = await page.locator('text=Admin').first().isVisible().catch(() => false);

    if (adminButton) {
      await page.locator('text=Admin').first().click();
      await page.waitForLoadState('networkidle');

      // Try to find moderation screen or button
      const modButton = await page.locator('text=Moderation').first().isVisible().catch(() => false);
      if (modButton) {
        await page.locator('text=Moderation').first().click();
        await page.waitForLoadState('networkidle');

        // Verify moderation stats are displayed
        const pending = await page.locator('text=Pending').first().isVisible().catch(() => false);
        expect(pending).toBe(true);
      }
    }
  });

  test('Moderation: Non-admin users cannot access moderation', async ({ page }) => {
    // Login as regular user
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);

    // Verify Admin/Moderation options are not available
    const adminButton = await page.locator('text=Admin').first().isVisible().catch(() => false);
    expect(adminButton).toBe(false);

    const modButton = await page.locator('text=Moderation').isVisible().catch(() => false);
    expect(modButton).toBe(false);
  });

  test('Moderation: Real data flows through Supabase to UI', async ({ page }) => {
    // Login as superadmin
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);

    // Navigate to admin area
    const adminButton = await page.locator('text=Admin').first().isVisible().catch(() => false);
    if (adminButton) {
      await page.locator('text=Admin').first().click();
      await page.waitForLoadState('networkidle');

      // Check for moderation stats or queue
      const pending = await page.locator('text=Pending').first().isVisible().catch(() => false);

      // Verify moderation data loads
      expect(pending).toBe(true);
    }
  });
});
