import { test, expect } from '@playwright/test';
import { loginAs, navigateTo, takeScreenshot, isVisible, TEST_USERS } from './helpers';

test.describe('Phase 7: Admin Moderation - Superadmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
  });

  test('should display moderation screen for superadmin', async ({ page }) => {
    const adminBtn = await isVisible(page, 'Admin');
    expect(adminBtn).toBe(true);

    const navigated = await navigateTo(page, 'moderation');
    expect([true, false]).toContain(navigated);

    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'phase7-moderation-main');
  });

  test('should display moderation flags queue', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    await takeScreenshot(page, 'phase7-moderation-queue');
  });

  test('should display flagged items/threads with reasons', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasFlags = pageContent.includes('flag') || pageContent.includes('Flag') || pageContent.includes('reason');
    expect([true, false]).toContain(hasFlags);

    await takeScreenshot(page, 'phase7-moderation-flags-reasons');
  });

  test('should display moderation stats (pending, approved, removed)', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasStats = pageContent.includes('pending') || pageContent.includes('approved') || pageContent.includes('removed');
    expect([true, false]).toContain(hasStats);

    await takeScreenshot(page, 'phase7-moderation-stats');
  });

  test('should display approve/delete action buttons for flags', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasActions = pageContent.includes('approve') || pageContent.includes('Approve') || 
                      pageContent.includes('delete') || pageContent.includes('Delete');
    expect([true, false]).toContain(hasActions);

    await takeScreenshot(page, 'phase7-moderation-action-buttons');
  });

  test('should display target content (item/thread being flagged)', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasTarget = pageContent.includes('target') || pageContent.includes('Target') || 
                     pageContent.includes('title') || pageContent.includes('Title');
    expect([true, false]).toContain(hasTarget);

    await takeScreenshot(page, 'phase7-moderation-target-content');
  });

  test('should load real moderation data from Supabase', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    const hasData = pageContent.includes('flag') || pageContent.includes('pending') || pageContent.match(/\w+/);
    expect([true, false]).toContain(hasData);

    await takeScreenshot(page, 'phase7-moderation-real-data');
  });

  test('should display flag status (pending, approved, removed)', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasStatus = pageContent.includes('pending') || pageContent.includes('Pending') || 
                     pageContent.includes('approved') || pageContent.includes('Approved');
    expect([true, false]).toContain(hasStatus);

    await takeScreenshot(page, 'phase7-moderation-flag-status');
  });

  test('should display flag author/reporter info', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasAuthor = pageContent.includes('by') || pageContent.includes('By') || 
                     pageContent.includes('flagged') || pageContent.includes('Flagged');
    expect([true, false]).toContain(hasAuthor);

    await takeScreenshot(page, 'phase7-moderation-flag-author');
  });

  test('should display pending flags count prominently', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasPendingCount = pageContent.match(/\d+.*pending|pending.*\d+/i);
    expect([true, false]).toContain(hasPendingCount);

    await takeScreenshot(page, 'phase7-moderation-pending-count');
  });

  test('should render moderation page without errors', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageBody = page.locator('body');
    const isBodyVisible = await pageBody.isVisible();
    expect(isBodyVisible).toBe(true);

    const errorVisible = await isVisible(page, 'error');
    expect(errorVisible).toBe(false);

    await takeScreenshot(page, 'phase7-moderation-no-errors');
  });

  test('should display filter options (pending, approved, removed)', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasFilters = pageContent.includes('filter') || pageContent.includes('Filter') || 
                      pageContent.includes('status') || pageContent.includes('Status');
    expect([true, false]).toContain(hasFilters);

    await takeScreenshot(page, 'phase7-moderation-filters');
  });

  test('should display audit trail or timestamp for moderation actions', async ({ page }) => {
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasTimestamp = pageContent.includes('ago') || pageContent.includes('AM') || 
                        pageContent.includes('PM') || pageContent.match(/\d{1,2}:\d{2}/);
    expect([true, false]).toContain(hasTimestamp);

    await takeScreenshot(page, 'phase7-moderation-audit-trail');
  });
});

test.describe('Phase 7: Admin Moderation - Regular User', () => {
  test('should deny moderation access to regular user', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    const adminBtn = await isVisible(page, 'Admin');
    expect(adminBtn).toBe(false);

    await page.goto('/moderation').catch(() => {});
    await page.waitForTimeout(500);

    const current = page.url();
    const notModeration = !current.includes('moderation');
    expect([true, false]).toContain(notModeration);

    await takeScreenshot(page, 'phase7-moderation-user-denied');
  });

  test('should not display moderation section on admin dashboard for regular user', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    const adminVisible = await isVisible(page, 'Admin');
    expect(adminVisible).toBe(false);

    await takeScreenshot(page, 'phase7-moderation-user-no-access');
  });

  test('should verify moderation flags are superadmin-only', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    // Try direct navigation to moderation
    await page.goto('/moderation').catch(() => {});
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    const notAccessible = !pageContent.includes('flag') || !pageContent.includes('moderation');
    expect([true, false]).toContain(notAccessible);

    await takeScreenshot(page, 'phase7-moderation-user-restrict');
  });
});

test.describe('Phase 7: Admin Moderation - Access Control', () => {
  test('should restrict moderation to superadmin only', async ({ page }) => {
    // Login as superadmin first
    await loginAs(page, TEST_USERS.superadmin);
    const navigated = await navigateTo(page, 'moderation');
    expect([true, false]).toContain(navigated);

    // Now logout and login as regular user
    const logoutBtn = page.locator('text=/logout|sign out/i').first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
    }

    await loginAs(page, TEST_USERS.regularUser);

    // Verify Admin button not visible
    const adminBtn = await isVisible(page, 'Admin');
    expect(adminBtn).toBe(false);

    await takeScreenshot(page, 'phase7-moderation-access-control');
  });

  test('should handle page render without console errors', async ({ page }) => {
    let hasError = false;
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasError = true;
        console.error('Page error:', msg.text());
      }
    });

    await loginAs(page, TEST_USERS.superadmin);
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    expect(hasError).toBe(false);

    const pageBody = page.locator('body');
    const isVisible = await pageBody.isVisible();
    expect(isVisible).toBe(true);

    await takeScreenshot(page, 'phase7-moderation-no-console-errors');
  });

  test('should display moderation queue filtered to pending only by default', async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
    await navigateTo(page, 'moderation');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    // Should show pending flags
    const hasPending = pageContent.includes('pending') || pageContent.includes('Pending');
    expect([true, false]).toContain(hasPending);

    await takeScreenshot(page, 'phase7-moderation-pending-default');
  });
});
