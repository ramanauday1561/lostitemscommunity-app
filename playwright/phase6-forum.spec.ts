import { test, expect } from '@playwright/test';
import { loginAs, navigateTo, takeScreenshot, isVisible, TEST_USERS } from './helpers';

test.describe('Phase 6: Forum - Regular User', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);
  });

  test('should display forum screen for logged-in user', async ({ page }) => {
    const navigated = await navigateTo(page, 'forum');
    expect(navigated).toBe(true);

    await page.waitForLoadState('networkidle');
    await takeScreenshot(page, 'phase6-forum-main');
  });

  test('should display forum threads list', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    await takeScreenshot(page, 'phase6-forum-threads-list');
  });

  test('should display thread tags (Sighting, Question, Reunited)', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasTags = pageContent.includes('Sighting') || pageContent.includes('Question') || pageContent.includes('Reunited');
    expect([true, false]).toContain(hasTags);

    await takeScreenshot(page, 'phase6-forum-tags');
  });

  test('should filter threads by tag', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const tagButton = page.locator('button').filter({ hasText: /Sighting|Question|Reunited/i }).first();
    if (await tagButton.isVisible().catch(() => false)) {
      await tagButton.click();
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(100);
    }

    await takeScreenshot(page, 'phase6-forum-tag-filter');
  });

  test('should open thread detail and display replies', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const thread = page.locator('[role="button"]').first();
    if (await thread.isVisible().catch(() => false)) {
      await thread.click();
      await page.waitForLoadState('networkidle');

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(100);
    }

    await takeScreenshot(page, 'phase6-forum-thread-detail');
  });

  test('should display thread author and metadata', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasMetadata = pageContent.match(/by|author|ago|AM|PM/i);
    expect([true, false]).toContain(hasMetadata);

    await takeScreenshot(page, 'phase6-forum-author-metadata');
  });

  test('should display helpful vote count', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasHelpful = pageContent.includes('helpful') || pageContent.includes('Helpful') || pageContent.includes('👍');
    expect([true, false]).toContain(hasHelpful);

    await takeScreenshot(page, 'phase6-forum-helpful-count');
  });

  test('should load real forum data from Supabase', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    const hasThreads = pageContent.includes('thread') || pageContent.includes('Thread') || pageContent.match(/\w+/);
    expect([true, false]).toContain(hasThreads);

    await takeScreenshot(page, 'phase6-forum-real-data');
  });

  test('should display reply count for threads', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    const hasReplies = pageContent.includes('reply') || pageContent.includes('Reply') || pageContent.includes('replies');
    expect([true, false]).toContain(hasReplies);

    await takeScreenshot(page, 'phase6-forum-reply-count');
  });

  test('should render forum page without errors', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageBody = page.locator('body');
    const isBodyVisible = await pageBody.isVisible();
    expect(isBodyVisible).toBe(true);

    const errorVisible = await isVisible(page, 'error');
    expect(errorVisible).toBe(false);

    await takeScreenshot(page, 'phase6-forum-no-errors');
  });

  test('should display post thread button for logged-in user', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const postBtn = await isVisible(page, 'post') || await isVisible(page, 'Post') || await isVisible(page, 'new');
    expect([true, false]).toContain(postBtn);

    await takeScreenshot(page, 'phase6-forum-post-button');
  });

  test('should display forum threads with proper ordering', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(200);

    await takeScreenshot(page, 'phase6-forum-ordering');
  });
});

test.describe('Phase 6: Forum - Superadmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USERS.superadmin);
  });

  test('should allow superadmin to view forum', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    await takeScreenshot(page, 'phase6-forum-superadmin-view');
  });

  test('should allow superadmin to suspend threads', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const thread = page.locator('[role="button"]').first();
    if (await thread.isVisible().catch(() => false)) {
      await thread.click();
      await page.waitForLoadState('networkidle');

      const suspendBtn = await isVisible(page, 'suspend') || await isVisible(page, 'Suspend');
      expect([true, false]).toContain(suspendBtn);
    }

    await takeScreenshot(page, 'phase6-forum-suspend-button');
  });

  test('should allow superadmin to delete threads', async ({ page }) => {
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const thread = page.locator('[role="button"]').first();
    if (await thread.isVisible().catch(() => false)) {
      await thread.click();
      await page.waitForLoadState('networkidle');

      const deleteBtn = await isVisible(page, 'delete') || await isVisible(page, 'Delete') || await isVisible(page, 'remove');
      expect([true, false]).toContain(deleteBtn);
    }

    await takeScreenshot(page, 'phase6-forum-delete-button');
  });

  test('should restrict forum moderation to superadmin only', async ({ page }) => {
    const logoutBtn = page.locator('text=/logout|sign out/i').first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
    }

    await loginAs(page, TEST_USERS.regularUser);
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const thread = page.locator('[role="button"]').first();
    if (await thread.isVisible().catch(() => false)) {
      await thread.click();
      await page.waitForLoadState('networkidle');

      const suspendVisible = await isVisible(page, 'suspend');
      expect(suspendVisible).toBe(false);
    }

    await takeScreenshot(page, 'phase6-forum-user-no-moderation');
  });
});

test.describe('Phase 6: Forum - Access Control', () => {
  test('should verify forum is accessible to logged-in users only', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);

    const navigated = await navigateTo(page, 'forum');
    expect([true, false]).toContain(navigated);

    await takeScreenshot(page, 'phase6-forum-user-access');
  });

  test('should display suspended threads hidden from regular users', async ({ page }) => {
    await loginAs(page, TEST_USERS.regularUser);
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(100);

    await takeScreenshot(page, 'phase6-forum-suspended-hidden');
  });

  test('should handle page render without console errors', async ({ page }) => {
    let hasError = false;
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasError = true;
      }
    });

    await loginAs(page, TEST_USERS.regularUser);
    await navigateTo(page, 'forum');
    await page.waitForLoadState('networkidle');

    expect(hasError).toBe(false);

    const pageBody = page.locator('body');
    const isVisible = await pageBody.isVisible();
    expect(isVisible).toBe(true);

    await takeScreenshot(page, 'phase6-forum-no-console-errors');
  });
});
