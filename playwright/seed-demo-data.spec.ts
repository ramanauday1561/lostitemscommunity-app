import { test, expect, Browser, Page } from '@playwright/test';
import { loginAs, TEST_USERS, TestUser } from './helpers';

/**
 * Fills the live project with sample data so every screen has something to show: posts in every category and
 * status, claims and chats between members, forum threads with replies and "helpful" votes, items in the
 * moderation queue (some pending, one approved), a thread the admin suspended, and support requests (one answered).
 *
 * Unlike the other specs this one KEEPS what it creates; that is its purpose. It writes real rows, so it only runs
 * with E2E_SEED=1. Everything belongs to the six test accounts, so it is easy to find and remove later.
 *
 *   E2E_SEED=1 \
 *   E2E_SUPERADMIN_PASSWORD=... E2E_USER_PASSWORD=... E2E_USER2_PASSWORD=... \
 *   E2E_SEED_TESTUSER1_PASSWORD=... E2E_SEED_TESTUSER2_PASSWORD=... npx playwright test seed-demo-data
 *
 * Member limits that shape it (database rate limits): 10 posts / 5 forum threads / 10 claims per hour each.
 */
test.skip(!process.env.E2E_SEED, 'Creates sample data on the live project; set E2E_SEED=1 to run');
test.describe.configure({ mode: 'serial' });
test.use({ viewport: { width: 390, height: 844 } });
test.setTimeout(240_000);

const PHONE = { width: 390, height: 844 };
const users: Record<string, TestUser> = {
  member1: TEST_USERS.regularUser,
  member2: TEST_USERS.secondUser,
  tester1: { username: 'testuser1', password: process.env.E2E_SEED_TESTUSER1_PASSWORD || '', role: 'user' },
  tester2: { username: 'testuser2', password: process.env.E2E_SEED_TESTUSER2_PASSWORD || '', role: 'user' },
  admin: TEST_USERS.superadmin,
};

type Kind = 'lost' | 'found';
interface Post { kind: Kind; title: string; cat: string; place: string; when: string; desc?: string }

const POSTS: Record<'member1' | 'member2' | 'tester1' | 'tester2', Post[]> = {
  member1: [
    { kind: 'lost', title: 'Black iPhone 14 with cracked corner', cat: 'Electronics', place: 'Central Station platform 3', when: '29 Sep 2026', desc: 'Navy case, photo of a dog on the lock screen.' },
    { kind: 'found', title: 'Brown leather wallet', cat: 'Wallets', place: 'Library steps', when: '30 Sep 2026', desc: 'Has a library card but no cash. Handed to the front desk.' },
    { kind: 'lost', title: 'Set of house keys with red tag', cat: 'Keys', place: 'Riverside Park bench', when: '1 Oct 2026' },
    { kind: 'found', title: 'Blue umbrella', cat: 'Other', place: 'Bus stop 9', when: '2 Oct 2026' },
  ],
  member2: [
    { kind: 'lost', title: 'Green backpack with laptop', cat: 'Bags', place: 'Cafe on 5th Ave', when: '28 Sep 2026', desc: 'Dell laptop inside, sticker of a mountain on the front.' },
    { kind: 'found', title: 'Passport in a grey sleeve', cat: 'Documents', place: 'Airport shuttle stop', when: '30 Sep 2026', desc: 'Handed in to the airport lost property desk.' },
    { kind: 'lost', title: 'Golden retriever named Biscuit', cat: 'Pets', place: 'Maple Street', when: '1 Oct 2026', desc: 'Friendly, red collar, microchipped.' },
    { kind: 'found', title: 'Silver wristwatch', cat: 'Other', place: 'Gym locker room', when: '2 Oct 2026' },
  ],
  tester1: [
    { kind: 'lost', title: 'Prescription glasses in a black case', cat: 'Other', place: 'Number 12 bus', when: '27 Sep 2026' },
    { kind: 'found', title: 'AirPods Pro charging case', cat: 'Electronics', place: 'Campus quad', when: '29 Sep 2026' },
    { kind: 'lost', title: 'Student ID and bus pass', cat: 'Documents', place: 'Science building', when: '1 Oct 2026' },
    { kind: 'found', title: 'Small tan crossbody bag', cat: 'Bags', place: 'Farmers market', when: '2 Oct 2026' },
  ],
  tester2: [
    { kind: 'lost', title: 'Car keys with a Toyota fob', cat: 'Keys', place: 'Shopping mall parking level 2', when: '30 Sep 2026' },
    { kind: 'found', title: 'Kids red scooter', cat: 'Other', place: 'Elm Street playground', when: '1 Oct 2026' },
    { kind: 'lost', title: 'Black cat with white paws', cat: 'Pets', place: 'Oak Avenue', when: '2 Oct 2026', desc: 'Answers to Socks, wearing a blue collar.' },
    { kind: 'found', title: 'Navy rain jacket', cat: 'Other', place: 'Community pool', when: '2 Oct 2026' },
  ],
};

async function as(browser: Browser, user: TestUser): Promise<Page> {
  const page = await (await browser.newContext({ viewport: PHONE })).newPage();
  await loginAs(page, user);
  return page;
}

const tab = (page: Page, name: 'Lost' | 'Found') => page.getByText(name, { exact: true }).last().click();
const closeSheet = (page: Page) => page.mouse.click(195, 18);
const avatar = (page: Page) => page.locator('[role="button"], [tabindex="0"]').filter({ hasText: /^[A-Z0-9]{1,2}$/ }).last();

async function report(page: Page, p: Post) {
  await page.getByText('add', { exact: true }).last().click();
  await page.getByText(p.kind === 'lost' ? 'I lost this' : 'I found this', { exact: true }).click();
  await page.getByPlaceholder('What is it? e.g. Blue backpack').fill(p.title);
  await page.getByText(p.cat, { exact: true }).first().click();
  await page.getByText('Continue', { exact: true }).click();
  await page.getByPlaceholder('Where? e.g. Central Station platform 3').fill(p.place);
  await page.getByPlaceholder('When? e.g. 12 Jun 2024').fill(p.when);
  if (p.desc) await page.getByPlaceholder('Marks, contents, colour — details only the owner would know.').fill(p.desc);
  await page.getByText('Submit to registry', { exact: true }).click();
  await expect(page.getByText('Report submitted')).toBeVisible({ timeout: 20000 });
  await page.getByText('View it in the registry', { exact: true }).click();
}

async function open(page: Page, p: Post) {
  await tab(page, p.kind === 'lost' ? 'Lost' : 'Found');
  await page.getByPlaceholder('Search title, place or reference').fill(p.title);
  await page.getByText(p.title).first().click();
  await expect(page.getByText(p.place).first()).toBeVisible({ timeout: 15000 });
}

async function sendChat(page: Page, post: Post, text: string) {
  await page.getByText('chat', { exact: true }).first().click();
  await page.getByText(post.title).first().click();
  await page.getByPlaceholder('Write a message').fill(text);
  await page.keyboard.press('Enter');
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 15000 });
}

async function claim(page: Page, p: Post) {
  await open(page, p);
  await page.getByText(p.kind === 'found' ? 'This is mine' : 'I have found this', { exact: true }).click();
  await expect(page.getByText(/Claim sent/).first()).toBeVisible({ timeout: 15000 });
}

test.describe('sample data for manual testing', () => {
  for (const key of ['member1', 'member2', 'tester1', 'tester2'] as const) {
    test(`${key} reports four posts`, async ({ browser }) => {
      const page = await as(browser, users[key]);
      for (const p of POSTS[key]) await report(page, p);
      await tab(page, 'Lost');
      await expect(page.getByText(POSTS[key].find((p) => p.kind === 'lost')!.title)).toBeVisible({ timeout: 15000 });
    });
  }

  test('some posts are handed over (Reunited) or closed (Resolved)', async ({ browser }) => {
    const plan: [keyof typeof POSTS, number, 'handover' | 'resolve'][] = [
      ['member1', 1, 'handover'], ['member2', 3, 'handover'], ['tester1', 1, 'handover'], ['tester2', 1, 'resolve'], ['member2', 1, 'resolve'],
    ];
    for (const [key, idx, action] of plan) {
      const page = await as(browser, users[key]);
      await open(page, POSTS[key][idx]);
      if (action === 'handover') {
        await page.getByText('Mark as handed over', { exact: true }).click();
        await expect(page.getByText(/marked as handed over/)).toBeVisible({ timeout: 15000 });
      } else {
        await page.getByText('Resolved', { exact: true }).last().click();
        await expect(page.getByText(/ closed\./)).toBeVisible({ timeout: 15000 });
      }
    }
  });

  test('members claim each other\'s posts and chat', async ({ browser }) => {
    // member2 claims two of member1's open posts; tester1 claims one of tester2's; member1 claims one of member2's
    const claims: [keyof typeof POSTS, keyof typeof POSTS, number, string, string][] = [
      ['member2', 'member1', 0, 'Hi, I think I saw this phone near the station.', 'Thanks! Where exactly did you see it?'],
      ['member2', 'member1', 2, 'I found keys with a red tag on Riverside Park, are these yours?', 'Yes, those are mine, thank you so much!'],
      ['tester1', 'tester2', 0, 'Are these Toyota keys still missing? I may have them.', 'They are! Can we meet at the mall entrance?'],
      ['member1', 'member2', 0, 'Is the green backpack still lost? A cafe near me handed one in.', 'Yes it is! Does it have a mountain sticker?'],
    ];
    for (const [claimant, owner, idx, first, reply] of claims) {
      const post = POSTS[owner][idx];
      const c = await as(browser, users[claimant]);
      await claim(c, post);
      await sendChat(c, post, first);
      const o = await as(browser, users[owner]);
      await o.getByText('notifications', { exact: true }).first().click();
      await expect(o.getByText(/claimed your item/).first()).toBeVisible({ timeout: 15000 });
      await closeSheet(o);
      await sendChat(o, post, reply);
    }
  });

  test('forum: threads, replies and helpful votes', async ({ browser }) => {
    const threads: [keyof typeof POSTS, string, string, string][] = [
      ['member1', 'Sighting', 'Saw a lost dog near Maple Street this morning', 'Golden retriever with a red collar, heading toward the park around 8am. Anyone missing one?'],
      ['member2', 'Question', 'What is the best way to describe a lost item?', 'I keep getting vague answers when people claim my posts. What details do you ask for?'],
      ['tester1', 'Reunited', 'Got my keys back, thank you!', 'A stranger from this community found my house keys and we met at the park. Faith in people restored.'],
      ['tester2', 'Question', 'Is it safe to meet at a train station?', 'Planning a handover tomorrow evening. Would you meet there or somewhere quieter?'],
    ];
    for (const [key, topic, title, body] of threads) {
      const page = await as(browser, users[key]);
      await page.getByText('Forum', { exact: true }).last().click();
      await page.getByText('New post', { exact: true }).first().click();
      await page.getByText(topic, { exact: true }).first().click();
      await page.getByPlaceholder('Give it a clear title').fill(title);
      await page.getByPlaceholder('Share what you saw, where and when.').fill(body);
      await page.getByText('Publish to the forum', { exact: true }).click();
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 15000 });
    }
    const replies: [keyof typeof POSTS, string, string][] = [
      ['member2', threads[0][2], 'That sounds like Biscuit, my dog! I will message you right now.'],
      ['tester1', threads[0][2], 'Hope you find the owner quickly.'],
      ['member1', threads[1][2], 'Where it was, when, and one detail only the owner would know (a scratch, a sticker).'],
      ['tester2', threads[1][2], 'Never put contact details in the post, use the in-app chat.'],
      ['member2', threads[2][2], 'Great news, congratulations!'],
      ['member1', threads[3][2], 'Public and busy is good. Station concourse in daylight works for me.'],
    ];
    for (const [key, title, text] of replies) {
      const page = await as(browser, users[key]);
      await page.getByText('Forum', { exact: true }).last().click();
      await page.getByText(title).first().click();
      await page.getByPlaceholder('Write a reply').fill(text);
      await page.keyboard.press('Enter');
      await expect(page.getByText(text).first()).toBeVisible({ timeout: 15000 });
    }
    for (const [key, title] of [['member2', threads[1][2]], ['tester1', threads[1][2]], ['member1', threads[2][2]], ['tester2', threads[2][2]], ['member1', threads[3][2]]] as const) {
      const page = await as(browser, users[key]);
      await page.getByText('Forum', { exact: true }).last().click();
      const card = page.locator('div').filter({ hasText: title }).filter({ has: page.getByText(/Helpful/) }).last();
      await card.getByText(/Helpful/).first().click();
      await page.waitForTimeout(800);
    }
  });

  test('support: one request waiting, one answered', async ({ browser }) => {
    for (const key of ['member2', 'tester1'] as const) {
      const page = await as(browser, users[key]);
      await avatar(page).click();
      await page.getByText('Help and support').first().click();
      await page.getByText('How can I claim an item?', { exact: true }).first().click();
      await expect(page.getByText(/secure messaging/).first()).toBeVisible({ timeout: 20000 });
      await page.getByText('Talk to a human instead').last().click();
      await expect(page.getByText(/passed this to our support team|already with our support team/i).first()).toBeVisible({ timeout: 15000 });
    }
    const admin = await as(browser, users.admin);
    await admin.getByText('Support inbox', { exact: true }).first().click();
    const card = admin.locator('div').filter({ hasText: 'testuser1' }).filter({ has: admin.getByText('Open & reply') }).last();
    await card.getByText('Open & reply').click();
    await admin.getByPlaceholder('Reply to this member').fill('Hi! This is support. Claims are done from the item page: open it and tap "This is mine".');
    await admin.keyboard.press('Enter');
    await expect(admin.getByText(/Claims are done from the item page/).first()).toBeVisible({ timeout: 15000 });
  });

  test('superadmin: moderation queue and a suspended thread', async ({ browser }) => {
    const admin = await as(browser, users.admin);
    const toFlag: Post[] = [POSTS.tester1[3], POSTS.member2[2], POSTS.tester2[3]];
    for (const p of toFlag) {
      await admin.getByText('Registry', { exact: true }).last().click();
      await open(admin, p);
      await admin.getByText('Send to queue', { exact: true }).click();
      await expect(admin.getByText(/(sent to|already in) the moderation queue/)).toBeVisible({ timeout: 15000 });
    }
    // approve one, leave two pending for the review screen
    await admin.getByText('Review', { exact: true }).last().click();
    await expect(admin.getByText(toFlag[2].title)).toBeVisible({ timeout: 15000 });
    const card = admin.locator('div').filter({ hasText: toFlag[2].title }).filter({ has: admin.getByText('Approve', { exact: true }) }).last();
    await card.getByText('Approve', { exact: true }).click();
    await expect(admin.getByText(toFlag[2].title)).toHaveCount(0, { timeout: 15000 });
    // suspend one forum thread
    await admin.getByText('Forum', { exact: true }).last().click();
    await admin.getByText('Is it safe to meet at a train station?').first().click();
    await admin.getByText('Suspend post', { exact: true }).last().click();
    await expect(admin.getByText('Restore post', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  });
});
