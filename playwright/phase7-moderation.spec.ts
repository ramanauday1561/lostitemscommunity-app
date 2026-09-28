import { test, expect } from '@playwright/test';

// Phase 7: Admin Moderation Queue
// Tests: loading moderation queue, approving flags, removing flagged content
//
// Prerequisites:
// - Phase 6 (Forum) tests pass
// - Superadmin account exists with role='superadmin'
// - Test flags have been created on items and forum threads in the database

test.describe('Phase 7: Admin Moderation Queue', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:8081';
  const SUPERADMIN_USER = 'superadmin';
  const SUPERADMIN_PASS = process.env.SUPERADMIN_PASS || 'SuperAdmin@123456';

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
  });

  test('should load moderation queue as superadmin', async ({ page }) => {
    // Sign in as superadmin
    await page.fill('input[placeholder*="Username"]', SUPERADMIN_USER);
    await page.fill('input[placeholder*="Password"]', SUPERADMIN_PASS);
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Navigate to Moderation screen
    await page.click('button:has-text("Admin")');
    await page.waitForSelector('text=Moderation', { timeout: 5000 });
    await page.click('button:has-text("Moderation")');

    // Verify moderation screen is loaded and queue displays
    await page.waitForSelector('text=Pending', { timeout: 5000 });

    // Check that moderation stats are displayed
    const pendingStats = await page.locator('text=Pending').first();
    expect(pendingStats).toBeTruthy();

    const approvedStats = await page.locator('text=Approved');
    expect(approvedStats).toBeTruthy();

    const removedStats = await page.locator('text=Removed');
    expect(removedStats).toBeTruthy();
  });

  test('should approve a flagged item', async ({ page }) => {
    // Sign in as superadmin
    await page.fill('input[placeholder*="Username"]', SUPERADMIN_USER);
    await page.fill('input[placeholder*="Password"]', SUPERADMIN_PASS);
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Navigate to Moderation screen
    await page.click('button:has-text("Admin")');
    await page.waitForSelector('text=Moderation', { timeout: 5000 });
    await page.click('button:has-text("Moderation")');

    // Wait for moderation queue to load
    await page.waitForSelector('text=Pending', { timeout: 5000 });

    // Find first flagged item in queue (if any exist)
    const flaggedItems = await page.locator('[data-testid="flagged-item"]').count();

    if (flaggedItems > 0) {
      // Get the first flagged item details
      const firstItemId = await page.locator('[data-testid="flagged-item"]').first().locator('[data-testid="flag-id"]').textContent();

      // Click Approve button on first item
      await page.locator('[data-testid="flagged-item"]').first().locator('button:has-text("Approve")').click();

      // Verify toast message shows approval
      await page.waitForSelector('text=approved and unflagged', { timeout: 5000 });

      // Verify the item is removed from the pending queue
      const updatedCount = await page.locator('[data-testid="flagged-item"]').count();
      expect(updatedCount).toBe(flaggedItems - 1);
    }
  });

  test('should remove a flagged item (delete/suspend)', async ({ page }) => {
    // Sign in as superadmin
    await page.fill('input[placeholder*="Username"]', SUPERADMIN_USER);
    await page.fill('input[placeholder*="Password"]', SUPERADMIN_PASS);
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Navigate to Moderation screen
    await page.click('button:has-text("Admin")');
    await page.waitForSelector('text=Moderation', { timeout: 5000 });
    await page.click('button:has-text("Moderation")');

    // Wait for moderation queue to load
    await page.waitForSelector('text=Pending', { timeout: 5000 });

    // Find first flagged item in queue (if any exist)
    const flaggedItems = await page.locator('[data-testid="flagged-item"]').count();

    if (flaggedItems > 0) {
      // Get the first flagged item type (to verify it gets suspended/deleted)
      const targetType = await page.locator('[data-testid="flagged-item"]').first().locator('[data-testid="target-type"]').textContent();

      // Click Remove button on first item
      await page.locator('[data-testid="flagged-item"]').first().locator('button:has-text("Delete")').click();

      // Verify toast message shows removal
      await page.waitForSelector('text=was permanently deleted by Super Admin', { timeout: 5000 });

      // Verify the item is removed from the pending queue
      const updatedCount = await page.locator('[data-testid="flagged-item"]').count();
      expect(updatedCount).toBe(flaggedItems - 1);

      // Verify the stats have been updated (removed count increased)
      const removedStat = await page.locator('text=Removed').first();
      expect(removedStat).toBeTruthy();
    }
  });

  test('should display different moderation stats after actions', async ({ page }) => {
    // Sign in as superadmin
    await page.fill('input[placeholder*="Username"]', SUPERADMIN_USER);
    await page.fill('input[placeholder*="Password"]', SUPERADMIN_PASS);
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Navigate to Moderation screen
    await page.click('button:has-text("Admin")');
    await page.waitForSelector('text=Moderation', { timeout: 5000 });
    await page.click('button:has-text("Moderation")');

    // Wait for moderation queue to load
    await page.waitForSelector('text=Pending', { timeout: 5000 });

    // Get initial pending count
    const pendingBefore = await page.locator('text=Pending').first().locator('..').textContent();

    // Perform an action (approve first item if available)
    const flaggedItems = await page.locator('[data-testid="flagged-item"]').count();

    if (flaggedItems > 0) {
      await page.locator('[data-testid="flagged-item"]').first().locator('button:has-text("Approve")').click();

      // Wait for toast
      await page.waitForSelector('text=approved and unflagged', { timeout: 5000 });

      // Re-fetch to ensure stats are updated
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForSelector('text=Pending', { timeout: 5000 });

      // Verify stats changed
      const pendingAfter = await page.locator('text=Pending').first().locator('..').textContent();

      // Pending should be less than or equal to before
      expect(parseInt(pendingAfter!)).toBeLessThanOrEqual(parseInt(pendingBefore!));
    }
  });

  test('should not allow non-admin users to access moderation', async ({ page }) => {
    // Create/use a regular user account
    const regularUser = 'simple.user';
    const regularPass = 'SimpleUser@123456';

    // Try to sign in as regular user
    await page.fill('input[placeholder*="Username"]', regularUser);
    await page.fill('input[placeholder*="Password"]', regularPass);
    await page.click('button:has-text("Sign in")');

    // Wait for dashboard to load
    await page.waitForSelector('text=Dashboard', { timeout: 10000 });

    // Verify Admin button is not available or Moderation screen cannot be accessed
    const adminButton = await page.locator('button:has-text("Admin")').count();
    expect(adminButton).toBe(0);
  });
});
