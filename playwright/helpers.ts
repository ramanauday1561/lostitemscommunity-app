import { Page } from '@playwright/test';

export interface TestUser {
  username: string;
  password: string;
  role: 'user' | 'superadmin';
}

export const TEST_USERS = {
  superadmin: {
    username: 'superadmin',
    password: 'Admin@12345',
    role: 'superadmin',
  } as TestUser,
  regularUser: {
    username: 'testuser2',
    password: 'Test@12345',
    role: 'user',
  } as TestUser,
};

/**
 * Login to the app with given credentials
 */
export async function loginAs(page: Page, user: TestUser) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click sign in button
  const signInBtn = page.locator('text=Sign In, text=sign in').first();
  try {
    await signInBtn.waitFor({ timeout: 5000 });
    await signInBtn.click();
    await page.waitForLoadState('networkidle');
  } catch {
    // Sign in button might not be visible, already on login page
  }

  // Fill login credentials
  const emailInputs = await page.locator(
    'input[type="text"], input[type="email"], input[placeholder*="name" i], input[placeholder*="email" i], input[placeholder*="username" i]'
  ).all();
  const passwordInputs = await page.locator('input[type="password"]').all();

  if (emailInputs.length > 0 && passwordInputs.length > 0) {
    await emailInputs[0].fill(user.username);
    await passwordInputs[0].fill(user.password);

    // Submit
    await page.click('button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")');

    // Wait for navigation
    try {
      await page.waitForURL('**/dash', { timeout: 20000 }).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
    } catch {
      // Navigation might not include /dash
      await page.waitForTimeout(2000);
    }
  }
}

/**
 * Logout from the app
 */
export async function logout(page: Page) {
  try {
    const profileBtn = page.locator('[role="button"]').filter({ hasText: /profile|logout|settings/i }).first();
    if (await profileBtn.isVisible().catch(() => false)) {
      await profileBtn.click();
      const logoutBtn = page.locator('text=Logout, text=Sign Out, text=Disconnect').first();
      if (await logoutBtn.isVisible().catch(() => false)) {
        await logoutBtn.click();
      }
    }
  } catch {
    // Logout might not be available, continue anyway
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForLoadState('networkidle');
    const adminBtn = await page.locator('text=Admin, text=Dashboard, text=Home').first().isVisible().catch(() => false);
    return adminBtn;
  } catch {
    return false;
  }
}

/**
 * Navigate to a screen by name
 */
export async function navigateTo(page: Page, screenName: string) {
  const mapping: Record<string, string> = {
    'dashboard': 'Dashboard, Home',
    'registry': 'Registry, Search',
    'forum': 'Forum',
    'report': 'Report',
    'chat': 'Chat, Messages',
    'profile': 'Profile',
    'admin': 'Admin',
    'moderation': 'Moderation',
    'members': 'Members',
    'analysis': 'Analysis',
    'ads': 'Ads, Ad placements',
  };

  const searchText = mapping[screenName.toLowerCase()] || screenName;
  const btn = page.locator(`text=${searchText}`).first();

  if (await btn.isVisible().catch(() => false)) {
    await btn.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);
    return true;
  }
  return false;
}

/**
 * Wait for text to appear on page
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.locator(`text=${text}`).first().waitFor({ timeout });
}

/**
 * Check if element is visible
 */
export async function isVisible(page: Page, text: string): Promise<boolean> {
  return await page.locator(`text=${text}`).first().isVisible().catch(() => false);
}

/**
 * Take a screenshot with a label
 */
export async function takeScreenshot(page: Page, label: string) {
  const filename = `${label.replace(/\s+/g, '-').toLowerCase()}.png`;
  await page.screenshot({ path: `/tmp/${filename}`, fullPage: true });
  return filename;
}
