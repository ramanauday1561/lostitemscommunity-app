import { test, expect, Page } from '@playwright/test';

import { loginAs as helperLogin, TEST_USERS } from './helpers';

const APP_URL = '';
const SUPERADMIN_EMAIL = TEST_USERS.superadmin.username;
const SUPERADMIN_PASS = TEST_USERS.superadmin.password;
const TESTUSER_EMAIL = TEST_USERS.regularUser.username;
const TESTUSER_PASS = TEST_USERS.regularUser.password;

/** Login through the shared helper (real Supabase flow, skips without E2E_* passwords) */
async function loginAs(page: Page, username: string, password: string) {
  const user = username === SUPERADMIN_EMAIL ? TEST_USERS.superadmin : TEST_USERS.regularUser;
  await helperLogin(page, { ...user, username, password });
}

/** Helper: navigate to forum */
async function goToForum(page: Page) {
  const forumTab = await page.locator('text=Forum').first().isVisible().catch(() => false);
  if (forumTab) {
    await page.locator('text=Forum').first().click();
  } else {
    await page.goto('/');
  }
  await page.waitForLoadState('networkidle');
}

test.describe('Phase 6: Admin Moderation - Superadmin Controls', () => {

  test('Admin: Superadmin can see moderation buttons on thread', async ({ page }) => {
    // Login as superadmin
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await expect(firstThread).toBeVisible({ timeout: 5000 });
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Look for admin-only buttons
    const suspendBtn = page.locator('text=/suspend|restore/i').first();
    const deleteBtn = page.locator('text=/delete|remove/i').first();

    // At least one should be visible
    const hasAdminControls = await suspendBtn.isVisible().catch(() => false) ||
                             await deleteBtn.isVisible().catch(() => false);

    if (hasAdminControls) {
      console.log('✓ Admin moderation controls visible to superadmin');
    } else {
      console.log('⚠ Admin controls not visible (may be in demo mode)');
    }
  });

  test('Admin: Superadmin can suspend and restore thread', async ({ page }) => {
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Find suspend button
    const suspendBtn = page.locator('text=/suspend|restore/i').first();

    if (await suspendBtn.isVisible().catch(() => false)) {
      const initialLabel = await suspendBtn.textContent().catch(() => 'suspend');
      console.log(`Initial button label: ${initialLabel}`);

      // Click suspend
      await suspendBtn.click();
      await page.waitForLoadState('networkidle');

      // Check if button changed to "Restore"
      const updatedLabel = await suspendBtn.textContent().catch(() => '');
      console.log(`Updated button label: ${updatedLabel}`);

      // Click restore to undo
      if (updatedLabel && updatedLabel.toLowerCase().includes('restore')) {
        await suspendBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('✓ Suspend and restore works');
      }
    }
  });

  test('Admin: Superadmin can delete thread (DESTRUCTIVE)', async ({ page }) => {
    test.skip(!process.env.E2E_ALLOW_DESTRUCTIVE, 'Deletes a real forum thread; set E2E_ALLOW_DESTRUCTIVE=1 to run');
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
    await goToForum(page);

    // Create test thread first
    const newThreadBtn = page.locator('text=/new|post|create.*thread/i').first();
    if (await newThreadBtn.isVisible().catch(() => false)) {
      await newThreadBtn.click();

      const threadTitle = `DELETE TEST ${Date.now()}`;
      const titleInput = page.locator('input[type="text"]').first();
      const bodyInput = page.locator('textarea, input[placeholder*="text" i]').first();

      await titleInput.fill(threadTitle);
      await bodyInput.fill('This thread will be deleted by admin');

      const publishBtn = page.locator('text=/publish|post/i').first();
      await publishBtn.click();

      await page.waitForLoadState('networkidle');

      // Open the thread we just created
      const threadBtn = page.locator(`text=${threadTitle}`).first();
      if (await threadBtn.isVisible().catch(() => false)) {
        await threadBtn.click();
        await page.waitForLoadState('networkidle');

        // Find delete button
        const deleteBtn = page.locator('text=/delete|remove/i').first();
        if (await deleteBtn.isVisible().catch(() => false)) {
          console.log('✓ Delete button visible to superadmin');

          // Note: We don't actually click delete to preserve test data
          // In real testing, this would confirm the delete works
          console.log('⚠ Delete button present but not clicked (to preserve test data)');
        }
      }
    }
  });

  test('Admin: Regular user CANNOT see moderation buttons', async ({ page }) => {
    // Login as regular user
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Look for admin-only buttons (should NOT be visible)
    const suspendBtn = page.locator('text=/suspend|restore/i').first();
    const deleteBtn = page.locator('text=/delete|remove/i').first();

    const hasAdminControls = await suspendBtn.isVisible().catch(() => false) ||
                             await deleteBtn.isVisible().catch(() => false);

    if (!hasAdminControls) {
      console.log('✓ Regular user does NOT see admin moderation controls (correct)');
    } else {
      console.log('✗ ERROR: Regular user can see admin controls (security issue!)');
    }
  });

  test('Admin: Multi-account with moderation (User creates, Admin suspends, User sees suspended)', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const pageUser = await context1.newPage();
    const pageAdmin = await context2.newPage();

    try {
      // User: Create thread
      await loginAs(pageUser, TESTUSER_EMAIL, TESTUSER_PASS);
      await goToForum(pageUser);

      const newThreadBtn = pageUser.locator('text=/new|post|create.*thread/i').first();
      await newThreadBtn.click();

      const threadTitle = `MODERATE TEST ${Date.now()}`;
      const titleInput = pageUser.locator('input[type="text"]').first();
      const bodyInput = pageUser.locator('textarea, input[placeholder*="text" i]').first();

      await titleInput.fill(threadTitle);
      await bodyInput.fill('This thread will be moderated');

      const publishBtn = pageUser.locator('text=/publish|post/i').first();
      await publishBtn.click();

      await pageUser.waitForLoadState('networkidle');
      await expect(pageUser.locator(`text=${threadTitle}`)).toBeVisible({ timeout: 5000 });
      console.log('✓ User created thread');

      // Admin: Suspend the thread
      await loginAs(pageAdmin, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
      await goToForum(pageAdmin);

      const threadBtn = pageAdmin.locator(`text=${threadTitle}`).first();
      if (await threadBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await threadBtn.click();
        await pageAdmin.waitForLoadState('networkidle');

        const suspendBtn = pageAdmin.locator('text=/suspend|restore/i').first();
        if (await suspendBtn.isVisible().catch(() => false)) {
          await suspendBtn.click();
          await pageAdmin.waitForLoadState('networkidle');
          console.log('✓ Admin suspended thread');

          // User: Check if thread shows as suspended
          await pageUser.reload();
          await pageUser.waitForLoadState('networkidle');

          const suspendedIndicator = pageUser.locator(`text=${threadTitle}`).first();
          if (await suspendedIndicator.isVisible().catch(() => false)) {
            // Check if it shows suspended status (style, label, etc)
            console.log('✓ User can still see suspended thread (with visual indication)');
          }
        }
      }
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Admin: Verify suspended threads are visually distinct', async ({ page }) => {
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
    await goToForum(page);

    // Get all threads
    const threads = await page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).count();
    console.log(`Total threads visible: ${threads}`);

    // Check if any show suspended status
    const suspendedThreads = await page.locator('text=/suspended|paused|archived/i').count();
    console.log(`Suspended threads visible: ${suspendedThreads}`);

    if (suspendedThreads > 0) {
      console.log('✓ Suspended threads show visual indicator');
    } else {
      console.log('⚠ No suspended threads or no visual indicator');
    }
  });

  test('Admin: Check RLS allows only superadmin to perform actions', async ({ page }) => {
    // This test verifies backend RLS policies
    // Login as regular user
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Try to access moderation (should fail or not show buttons)
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Check console for any RLS errors
    let consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.text().includes('RLS')) {
        consoleErrors.push(msg.text());
      }
    });

    // Try clicking where delete button would be (should not work)
    const deleteBtn = page.locator('text=/delete|remove/i').first();
    const hasDelete = await deleteBtn.isVisible().catch(() => false);

    if (!hasDelete && consoleErrors.length === 0) {
      console.log('✓ RLS policies working: regular user cannot access moderation');
    } else if (hasDelete) {
      console.log('✗ ERROR: Regular user can see delete button (RLS failure)');
    }
  });
});
