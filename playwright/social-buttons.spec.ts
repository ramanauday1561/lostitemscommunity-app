import { test, expect } from '@playwright/test';

/** The Google / Facebook / X buttons are on the sign-in and sign-up screens; sign-in itself comes later. */
test.use({ viewport: { width: 390, height: 844 } });

async function openLogin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByText('Skip', { exact: true }).click();
  await expect(page.getByPlaceholder('Username or email')).toBeVisible();
}

test('sign-in screen shows the three social buttons, and a tap says it is coming soon', async ({ page }) => {
  await openLogin(page);
  for (const name of ['Google', 'Facebook', 'X']) await expect(page.getByLabel(`Continue with ${name}`)).toBeVisible();
  await page.getByLabel('Continue with Google').click();
  await expect(page.getByText('Sign in with Google is coming soon.')).toBeVisible();
  await expect(page.getByPlaceholder('Username or email')).toBeVisible(); // still on the sign-in screen
});

test('sign-up screen shows them too', async ({ page }) => {
  await openLogin(page);
  await page.getByText('Join free in 30 seconds').click();
  for (const name of ['Google', 'Facebook', 'X']) await expect(page.getByLabel(`Continue with ${name}`)).toBeVisible();
  await page.getByLabel('Continue with Facebook').click();
  await expect(page.getByText('Sign in with Facebook is coming soon.')).toBeVisible();
});
