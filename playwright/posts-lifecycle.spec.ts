import { test, expect, Browser, Page } from '@playwright/test';
import { loginAs, TEST_USERS, TestUser } from './helpers';

/**
 * End-to-end lifecycle of several posts, with three real accounts:
 *   member 1 (E2E_USER_*)   reports four posts, hands one over, closes one, withdraws the rest
 *   member 2 (E2E_USER2_*)  tries to claim: a handed-over post offers no claim, an open one does; chats with member 1
 *   superadmin              sends one post to the moderation queue and approves it, sends another and deletes it
 *
 * It writes real rows to the live project, so it only runs with E2E_ALLOW_DESTRUCTIVE=1, and it removes everything it
 * creates (posts are tagged with a run id; the last test withdraws or deletes whatever is left).
 */
test.skip(!process.env.E2E_ALLOW_DESTRUCTIVE, 'Creates and removes real posts; set E2E_ALLOW_DESTRUCTIVE=1 to run');
test.describe.configure({ mode: 'serial' });
// A phone-sized window: the app fills it (a wider one shows the framed phone mock, and sheet backdrops move).
test.use({ viewport: { width: 390, height: 844 } });

const RUN = `PW${Date.now().toString().slice(-6)}`;
const POSTS = {
  umbrella: { kind: 'lost', title: `${RUN} blue umbrella`, cat: 'Other', place: 'Central Station' },
  scarf: { kind: 'lost', title: `${RUN} grey scarf`, cat: 'Other', place: 'Bus stop 9' },
  wallet: { kind: 'found', title: `${RUN} brown wallet`, cat: 'Wallets', place: 'Library steps' },
  keys: { kind: 'found', title: `${RUN} house keys`, cat: 'Keys', place: 'Riverside Park bench' },
} as const;
type PostName = keyof typeof POSTS;

/** A fresh, signed-in browser tab for one person. */
async function as(browser: Browser, user: TestUser): Promise<Page> {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await loginAs(page, user);
  return page;
}

const tab = (page: Page, name: 'Lost' | 'Found') => page.getByText(name, { exact: true }).last().click();
/** Dismisses the open bottom sheet by tapping the dimmed area above it. */
const closeSheet = (page: Page) => page.mouse.click(195, 18);

async function openPost(page: Page, name: PostName) {
  const p = POSTS[name];
  await tab(page, p.kind === 'lost' ? 'Lost' : 'Found');
  await page.getByPlaceholder('Search title, place or reference').fill(RUN);
  await page.getByText(p.title).first().click();
  await expect(page.getByText(p.place).first()).toBeVisible({ timeout: 15000 });
}

async function reportPost(page: Page, name: PostName) {
  const p = POSTS[name];
  await page.getByText('add', { exact: true }).last().click();
  await page.getByText(p.kind === 'lost' ? 'I lost this' : 'I found this', { exact: true }).click();
  await page.getByPlaceholder('What is it? e.g. Blue backpack').fill(p.title);
  await page.getByText(p.cat, { exact: true }).first().click();
  await page.getByText('Continue', { exact: true }).click();
  await page.getByPlaceholder('Where? e.g. Central Station platform 3').fill(p.place);
  await page.getByPlaceholder('When? e.g. 12 Jun 2024').fill('1 Oct 2026');
  await page.getByText('Submit to registry', { exact: true }).click();
  // Members may report 10 posts an hour (database rate limit) and this spec reports 4, so more than two runs an hour
  // fail here; say so instead of timing out.
  const tooOften = page.getByText(/doing that too often/);
  await Promise.race([
    page.getByText('Report submitted').waitFor({ timeout: 20000 }),
    tooOften.waitFor({ timeout: 20000 }).then(() => { throw new Error('Hit the 10-posts-per-hour limit; wait for it to reset and run again'); }),
  ]);
  await page.getByText('View it in the registry', { exact: true }).click();
}

test.describe('post lifecycle with three accounts', () => {
  test('member 1 reports four posts and finds each in the right registry tab', async ({ browser }) => {
    const a = await as(browser, TEST_USERS.regularUser);
    for (const name of Object.keys(POSTS) as PostName[]) await reportPost(a, name);

    await tab(a, 'Lost');
    await a.getByPlaceholder('Search title, place or reference').fill(RUN);
    await expect(a.getByText(POSTS.umbrella.title)).toBeVisible({ timeout: 15000 });
    await expect(a.getByText(POSTS.scarf.title)).toBeVisible();
    await expect(a.getByText(POSTS.wallet.title)).toHaveCount(0);
    await tab(a, 'Found');
    await a.getByPlaceholder('Search title, place or reference').fill(RUN);
    await expect(a.getByText(POSTS.wallet.title)).toBeVisible({ timeout: 15000 });
    await expect(a.getByText(POSTS.keys.title)).toBeVisible();
    await expect(a.getByText(POSTS.umbrella.title)).toHaveCount(0);
  });

  test('member 1 hands the umbrella over: it becomes Reunited', async ({ browser }) => {
    const a = await as(browser, TEST_USERS.regularUser);
    await openPost(a, 'umbrella');
    await expect(a.getByText('Mark as handed over')).toBeVisible();
    await a.getByText('Mark as handed over', { exact: true }).click();
    await expect(a.getByText('Reopen this post')).toBeVisible({ timeout: 15000 });
    await expect(a.getByText(/marked as handed over/)).toBeVisible({ timeout: 15000 });
    await closeSheet(a);
    await a.getByText('Reunited', { exact: true }).first().click();   // registry filter pill
    await expect(a.getByText(POSTS.umbrella.title)).toBeVisible({ timeout: 15000 });
    await expect(a.getByText(POSTS.scarf.title)).toHaveCount(0);
  });

  test('member 2: a handed-over post offers no claim, an open one does', async ({ browser }) => {
    const b = await as(browser, TEST_USERS.secondUser);
    // the umbrella is Reunited: no "I have found this", and a note says why
    await openPost(b, 'umbrella');
    await expect(b.getByText('I have found this')).toHaveCount(0);
    await expect(b.getByText(/already been reunited/).first()).toBeVisible();
    await closeSheet(b);
    // the scarf is still open
    await openPost(b, 'scarf');
    await expect(b.getByText('I have found this', { exact: true })).toBeVisible();
    await b.getByText('I have found this', { exact: true }).click();
    await expect(b.getByText(/Claim sent/).first()).toBeVisible({ timeout: 15000 });
  });

  test('member 2 chats with member 1 about the scarf, and member 1 replies', async ({ browser }) => {
    const b = await as(browser, TEST_USERS.secondUser);
    await b.getByText('chat', { exact: true }).first().click();
    await b.getByText(POSTS.scarf.title).first().click();
    await b.getByPlaceholder('Write a message').fill(`${RUN}: I think I found your scarf`);
    await b.keyboard.press('Enter');
    await expect(b.getByText(/I think I found your scarf/).first()).toBeVisible({ timeout: 15000 });

    const a = await as(browser, TEST_USERS.regularUser);
    await a.getByText('notifications', { exact: true }).first().click();
    await expect(a.getByText(/claimed your item/).first()).toBeVisible({ timeout: 15000 });
    await a.getByText(/New message/).first().click();
    await expect(a.getByText(/I think I found your scarf/).first()).toBeVisible({ timeout: 15000 });
    await a.getByPlaceholder('Write a message').fill(`${RUN}: yes, that is mine - thank you`);
    await a.keyboard.press('Enter');
    await expect(a.getByText(/that is mine - thank you/).first()).toBeVisible({ timeout: 15000 });

    await b.reload();
    await b.getByText('chat', { exact: true }).first().click();
    await b.getByText(POSTS.scarf.title).first().click();
    await expect(b.getByText(/that is mine - thank you/).first()).toBeVisible({ timeout: 15000 });
  });

  test('member 1 closes the scarf as Resolved', async ({ browser }) => {
    const a = await as(browser, TEST_USERS.regularUser);
    await openPost(a, 'scarf');
    // The sheet is drawn over the registry, so its status pill is the last "Resolved" on the page.
    await a.getByText('Resolved', { exact: true }).last().click();
    await expect(a.getByText(/ closed\./)).toBeVisible({ timeout: 15000 });   // the confirmation toast: the update has landed
    await closeSheet(a);
    await a.getByText('Resolved', { exact: true }).first().click();   // registry filter pill
    await expect(a.getByText(POSTS.scarf.title)).toBeVisible({ timeout: 15000 });
  });

  test('superadmin sends the wallet to the queue and approves it, sends the keys and deletes them', async ({ browser }) => {
    const admin = await as(browser, TEST_USERS.superadmin);
    for (const name of ['wallet', 'keys'] as const) {
      await admin.getByText('Registry', { exact: true }).last().click();
      await openPost(admin, name);
      await admin.getByText('Send to queue', { exact: true }).click();
      await expect(admin.getByText(/sent to the moderation queue/)).toBeVisible({ timeout: 15000 });
    }
    await admin.getByText('Review', { exact: true }).last().click();
    await expect(admin.getByText(POSTS.wallet.title)).toBeVisible({ timeout: 15000 });
    await expect(admin.getByText(POSTS.keys.title)).toBeVisible();

    // approve the wallet (its card), delete the keys (theirs)
    const walletCard = admin.locator('div').filter({ hasText: POSTS.wallet.title }).filter({ has: admin.getByText('Approve', { exact: true }) }).last();
    await walletCard.getByText('Approve', { exact: true }).click();
    await expect(admin.getByText(POSTS.wallet.title)).toHaveCount(0, { timeout: 15000 });
    const keysCard = admin.locator('div').filter({ hasText: POSTS.keys.title }).filter({ has: admin.getByText('Delete', { exact: true }) }).last();
    await keysCard.getByText('Delete', { exact: true }).click();
    await expect(admin.getByText(POSTS.keys.title)).toHaveCount(0, { timeout: 15000 });

    // the keys are gone for good; the wallet is open again
    const a = await as(browser, TEST_USERS.regularUser);
    await tab(a, 'Found');
    await a.getByPlaceholder('Search title, place or reference').fill(RUN);
    await expect(a.getByText(POSTS.wallet.title)).toBeVisible({ timeout: 15000 });
    await expect(a.getByText(POSTS.keys.title)).toHaveCount(0);
  });

  test('cleanup: member 1 withdraws every post this run created', async ({ browser }) => {
    const a = await as(browser, TEST_USERS.regularUser);
    for (const name of ['umbrella', 'scarf', 'wallet'] as const) {
      await openPost(a, name).catch(() => undefined);
      const withdraw = a.getByText('Withdraw this post', { exact: true });
      if (await withdraw.isVisible().catch(() => false)) await withdraw.click();
      await a.waitForTimeout(800);
    }
    for (const name of ['umbrella', 'scarf'] as const) {
      await tab(a, 'Lost');
      await a.getByPlaceholder('Search title, place or reference').fill(RUN);
      await a.waitForTimeout(1200);
      await expect(a.getByText(POSTS[name].title)).toHaveCount(0);
    }
    await tab(a, 'Found');
    await a.getByPlaceholder('Search title, place or reference').fill(RUN);
    await a.waitForTimeout(1200);
    await expect(a.getByText(POSTS.wallet.title)).toHaveCount(0);
  });
});
