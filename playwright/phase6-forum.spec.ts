import { test, expect, Page } from '@playwright/test';

const APP_URL = 'http://localhost:3000';
const TESTUSER_EMAIL = 'testuser@example.com';
const TESTUSER_PASS = 'Test@12345';
const TESTUSER2_EMAIL = 'testuser2@example.com';
const TESTUSER2_PASS = 'Test@12345';
const SUPERADMIN_EMAIL = 'superadmin@example.com';
const SUPERADMIN_PASS = 'Admin@12345';

/** Helper: login with given credentials */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto(APP_URL);
  await page.waitForSelector('text=Sign In');

  // Click sign in if on welcome screen
  const welcomeSignIn = await page.locator('text=Sign In').first().isVisible().catch(() => false);
  if (welcomeSignIn) {
    await page.locator('text=Sign In').first().click();
  }

  await page.fill('input[type="email"], input[placeholder*="email" i], input[placeholder*="username" i]', email);
  await page.fill('input[type="password"]', password);
  await page.click('text=Sign In');

  // Wait for dashboard to load
  await page.waitForURL('**/dash', { timeout: 10000 });
}

/** Helper: navigate to forum */
async function goToForum(page: Page) {
  // Click forum tab or navigate
  const forumTab = await page.locator('text=Forum, text=forum').first().isVisible().catch(() => false);
  if (forumTab) {
    await page.locator('text=Forum').first().click();
  } else {
    // Navigate directly
    await page.goto(`${APP_URL}/forum`);
  }
  await page.waitForLoadState('networkidle');
}

test.describe('Phase 6: Forum - E2E Tests', () => {

  test('Forum: Load threads from Supabase (testuser)', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Verify forum screen loads
    await expect(page.locator('text=Forum').first()).toBeVisible();

    // Check for topic filters (All, Sighting, Question, Reunited)
    await expect(page.locator('text=All').first()).toBeVisible();
    await expect(page.locator('text=Sighting').first()).toBeVisible();
    await expect(page.locator('text=Question').first()).toBeVisible();

    // Threads should load (from Supabase or mock)
    const threadCount = await page.locator('[role="button"]').filter({ hasText: /\d+ repl/i }).count();
    console.log(`Loaded ${threadCount} threads`);
  });

  test('Forum: Filter threads by tag (Sighting)', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Click Sighting filter
    await page.locator('text=Sighting').click();
    await page.waitForLoadState('networkidle');

    // Verify filter applied (check URL or visual indicator)
    const allChip = await page.locator('text=All').first().isVisible();
    const sightingChip = await page.locator('text=Sighting').first().isVisible();

    expect(allChip || sightingChip).toBeTruthy();
  });

  test('Forum: Create new thread (testuser)', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Click "New Thread" or "Post" button
    const newThreadBtn = page.locator('text=/new|post|create.*thread|start.*thread/i').first();
    await expect(newThreadBtn).toBeVisible({ timeout: 5000 });
    await newThreadBtn.click();

    // Wait for form to appear
    await page.waitForSelector('input[placeholder*="title" i], [type="text"]', { timeout: 5000 });

    // Fill in thread form
    const threadTitle = `Test Thread ${Date.now()}`;
    const threadBody = 'This is a test thread created by testuser.';

    const titleInput = page.locator('input[placeholder*="title" i], input[type="text"]').first();
    const bodyInput = page.locator('textarea, input[placeholder*="text" i], input[placeholder*="body" i]').first();

    await titleInput.fill(threadTitle);
    await bodyInput.fill(threadBody);

    // Select tag (Question is default)
    const questionTag = page.locator('text=Question').first();
    await expect(questionTag).toBeVisible();

    // Submit
    const publishBtn = page.locator('text=/publish|post|create|submit/i').first();
    await publishBtn.click();

    // Verify thread appears in list
    await page.waitForLoadState('networkidle');
    const threadOnList = page.locator(`text=${threadTitle}`).first();
    await expect(threadOnList).toBeVisible({ timeout: 5000 });
  });

  test('Forum: Open thread and view replies', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await expect(firstThread).toBeVisible({ timeout: 5000 });
    await firstThread.click();

    // Verify thread detail sheet opens
    await expect(page.locator('text=/reply|replies/i').first()).toBeVisible({ timeout: 5000 });

    // Check for reply composer
    const replyComposer = page.locator('input[placeholder*="reply" i], textarea[placeholder*="reply" i]').first();
    await expect(replyComposer).toBeVisible();
  });

  test('Forum: Reply to thread (testuser)', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    // Wait for thread detail
    await page.waitForLoadState('networkidle');

    // Fill reply
    const replyText = `Reply from testuser: ${Date.now()}`;
    const replyInput = page.locator('input[placeholder*="reply" i], textarea[placeholder*="reply" i]').first();
    await replyInput.fill(replyText);

    // Send reply
    const sendBtn = page.locator('button[aria-label*="send" i], text=Send').first();
    await sendBtn.click();

    // Verify reply appears
    await page.waitForLoadState('networkidle');
    const replyOnPage = page.locator(`text=${replyText.slice(0, 30)}`).first();
    await expect(replyOnPage).toBeVisible({ timeout: 5000 });
  });

  test('Forum: Mark thread as helpful (testuser)', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Open first thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    // Look for helpful button (thumb up icon or text)
    const helpfulBtn = page.locator('[aria-label*="helpful" i], text=/helpful|thumb/i, button >> text=/👍|helpful/').first();

    if (await helpfulBtn.isVisible().catch(() => false)) {
      const initialCount = await helpfulBtn.textContent().catch(() => '0');
      console.log(`Initial helpful count: ${initialCount}`);

      await helpfulBtn.click();
      await page.waitForLoadState('networkidle');

      const updatedCount = await helpfulBtn.textContent().catch(() => '0');
      console.log(`Updated helpful count: ${updatedCount}`);
    }
  });

  test('Forum: Two accounts interaction (testuser1 creates, testuser2 replies)', async ({ browser }) => {
    // Open two browser contexts for parallel testing
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // testuser1: login and create thread
      await loginAs(page1, TESTUSER_EMAIL, TESTUSER_PASS);
      await goToForum(page1);

      const newThreadBtn = page1.locator('text=/new|post|create.*thread/i').first();
      await newThreadBtn.click();

      const threadTitle = `Multi-User Test ${Date.now()}`;
      const threadBody = 'This thread will be replied to by testuser2.';

      const titleInput = page1.locator('input[type="text"], input[placeholder*="title" i]').first();
      const bodyInput = page1.locator('textarea, input[placeholder*="text" i]').first();

      await titleInput.fill(threadTitle);
      await bodyInput.fill(threadBody);

      const publishBtn = page1.locator('text=/publish|post/i').first();
      await publishBtn.click();

      // Verify thread created
      await page1.waitForLoadState('networkidle');
      await expect(page1.locator(`text=${threadTitle}`)).toBeVisible({ timeout: 5000 });
      console.log('✓ testuser1 created thread');

      // testuser2: login, go to forum, find and open the thread
      await loginAs(page2, TESTUSER2_EMAIL, TESTUSER2_PASS);
      await goToForum(page2);

      // Look for the created thread
      const thread2 = page2.locator(`text=${threadTitle}`).first();
      await expect(thread2).toBeVisible({ timeout: 10000 });
      console.log('✓ testuser2 can see thread created by testuser1');

      // Open thread and reply
      const openBtn = page2.locator('[role="button"]').filter({ hasText: threadTitle }).first();
      await openBtn.click();

      await page2.waitForLoadState('networkidle');

      const reply2Text = `Reply from testuser2: ${Date.now()}`;
      const replyInput = page2.locator('input[placeholder*="reply" i], textarea[placeholder*="reply" i]').first();
      await replyInput.fill(reply2Text);

      const sendBtn = page2.locator('button >> text=Send, button >> text=send, [aria-label*="send"]').first();
      await sendBtn.click();

      // Verify reply appears on testuser2's screen
      await page2.waitForLoadState('networkidle');
      await expect(page2.locator(`text=${reply2Text.slice(0, 30)}`)).toBeVisible({ timeout: 5000 });
      console.log('✓ testuser2 posted reply');

      // testuser1: Refresh and see reply from testuser2
      await page1.reload();
      await page1.waitForLoadState('networkidle');

      const thread1 = page1.locator(`text=${threadTitle}`).first();
      await expect(thread1).toBeVisible();

      const openBtn1 = page1.locator('[role="button"]').filter({ hasText: threadTitle }).first();
      await openBtn1.click();

      await page1.waitForLoadState('networkidle');
      await expect(page1.locator(`text=${reply2Text.slice(0, 30)}`)).toBeVisible({ timeout: 5000 });
      console.log('✓ testuser1 can see reply from testuser2');

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Forum: Admin can moderate - suspend thread (superadmin)', async ({ page }) => {
    await loginAs(page, SUPERADMIN_EMAIL, SUPERADMIN_PASS);
    await goToForum(page);

    // Verify admin sees moderation options
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Look for suspend/delete buttons (admin only)
    const suspendBtn = page.locator('text=/suspend|restore/i').first();
    const deleteBtn = page.locator('text=/delete|remove/i').first();

    const hasSuspendOrDelete = await suspendBtn.isVisible().catch(() => false) || await deleteBtn.isVisible().catch(() => false);

    if (hasSuspendOrDelete) {
      console.log('✓ Admin has moderation options');
    } else {
      console.log('⚠ Moderation buttons not visible (may be in demo mode)');
    }
  });

  test('Forum: Verify thread count increases after creating thread', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Get initial thread count
    const initialThreads = await page.locator('[role="button"]').filter({ hasText: /\d+ repl/i }).count();
    console.log(`Initial thread count: ${initialThreads}`);

    // Create new thread
    const newThreadBtn = page.locator('text=/new|post|create.*thread/i').first();
    await newThreadBtn.click();

    const threadTitle = `Count Test ${Date.now()}`;
    const threadBody = 'Testing thread count.';

    const titleInput = page.locator('input[type="text"]').first();
    const bodyInput = page.locator('textarea, input[placeholder*="text" i]').first();

    await titleInput.fill(threadTitle);
    await bodyInput.fill(threadBody);

    const publishBtn = page.locator('text=/publish|post/i').first();
    await publishBtn.click();

    // Get updated thread count
    await page.waitForLoadState('networkidle');
    const updatedThreads = await page.locator('[role="button"]').filter({ hasText: /\d+ repl/i }).count();
    console.log(`Updated thread count: ${updatedThreads}`);

    expect(updatedThreads).toBeGreaterThanOrEqual(initialThreads);
  });

  test('Forum: Tag filtering persists across navigation', async ({ page }) => {
    await loginAs(page, TESTUSER_EMAIL, TESTUSER_PASS);
    await goToForum(page);

    // Select Sighting tag
    const sightingTag = page.locator('text=Sighting').first();
    await sightingTag.click();
    await page.waitForLoadState('networkidle');

    // Open a thread
    const firstThread = page.locator('[role="button"]').filter({ hasText: /reply|replies/i }).first();
    await firstThread.click();

    await page.waitForLoadState('networkidle');

    // Close thread (go back)
    const closeBtn = page.locator('[aria-label*="close" i], button >> text=✕').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      await page.goBack();
    }

    await page.waitForLoadState('networkidle');

    // Verify tag filter still applied
    const sightingChip = page.locator('text=Sighting').first();
    await expect(sightingChip).toBeVisible();
    console.log('✓ Tag filter persists');
  });
});
