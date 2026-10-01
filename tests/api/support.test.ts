/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as support from '../../src/api/support';

const quiet = async <T>(fn: () => Promise<T>) => {
  const orig = console.error; console.error = () => {};
  try { return await fn(); } finally { console.error = orig; }
};

describe('support api', () => {
  beforeEach(() => fake.reset());

  test('getFaqEntries is ordered by position; errors give []', async () => {
    fake.queue({ data: [{ id: 'f1' }] });
    assert.deepEqual(await support.getFaqEntries(), [{ id: 'f1' }]);
    assert.ok(fake.has('order', 'position', { ascending: true }));
    fake.queue({ error: { message: 'boom' } });
    assert.deepEqual(await quiet(() => support.getFaqEntries()), []);
  });

  describe('matchFaq (pure: no request)', () => {
    const faq = [
      { id: 'f1', keywords: ['claim', 'owner'], question: 'How can I claim an item?', answer: 'a1' },
      { id: 'f2', keywords: ['photo', 'upload'], question: 'How do I add a photo?', answer: 'a2' },
    ];

    test('an exact question (a tapped chip) matches, case-insensitively', () => {
      assert.equal(support.matchFaq(faq as any, 'how do i ADD a photo?')?.id, 'f2');
    });

    test('otherwise the first entry whose keyword appears in the text wins', () => {
      assert.equal(support.matchFaq(faq as any, 'can I upload something')?.id, 'f2');
      assert.equal(support.matchFaq(faq as any, 'I want to claim it, upload too')?.id, 'f1', 'earlier entry wins');
    });

    test('the keyword must be IN the text, not the other way round (the old fetch-one version had this backwards)', () => {
      assert.equal(support.matchFaq(faq as any, 'ow'), null);
    });

    test('no match, a blank text, or entries without keywords give null', () => {
      assert.equal(support.matchFaq(faq as any, 'refund please'), null);
      assert.equal(support.matchFaq(faq as any, '   '), null);
      assert.equal(support.matchFaq([{ id: 'x', keywords: null, question: 'q', answer: 'a' }] as any, 'anything'), null);
    });

    test('makes no database request', () => {
      support.matchFaq(faq as any, 'claim');
      assert.equal(fake.calls.length, 0);
    });
  });

  test('loadSupportMessages is scoped to the user, oldest first; errors give []', async () => {
    fake.queue({ data: [{ id: 'm1' }] });
    assert.deepEqual(await support.loadSupportMessages('u1'), [{ id: 'm1' }]);
    assert.ok(fake.has('eq', 'user_id', 'u1'));
    assert.ok(fake.has('order', 'created_at', { ascending: true }));
    fake.queue({ error: { message: 'boom' } });
    assert.deepEqual(await quiet(() => support.loadSupportMessages('u1')), []);
  });

  describe('sendSupportMessage', () => {
    test('inserts the trimmed message as the user by default, or as the bot', async () => {
      await support.sendSupportMessage('u1', '  help  ');
      assert.deepEqual(fake.args('insert', 0), [{ user_id: 'u1', body: 'help', sender: 'user' }]);
      await support.sendSupportMessage('u1', 'answer', 'bot');
      assert.equal((fake.args('insert', 1) as [{ sender: string }])[0].sender, 'bot');
    });

    test('blank is a no-op; errors throw', async () => {
      await support.sendSupportMessage('u1', '  ');
      assert.equal(fake.calls.length, 0);
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(support.sendSupportMessage('u1', 'x'), /denied/);
    });
  });
});

describe('support inbox api (11.3)', () => {
  beforeEach(() => fake.reset());

  test('openSupportRequest inserts a request for the member', async () => {
    assert.equal(await support.openSupportRequest('u1'), 'opened');
    assert.equal(fake.calls[0].name, 'support_requests');
    assert.deepEqual(fake.args('insert', 0), [{ user_id: 'u1' }]);
  });

  test('a second open request is not an error: it reports already_open (unique violation 23505)', async () => {
    fake.queue({ error: { message: 'duplicate key value', code: '23505' } as any });
    assert.equal(await support.openSupportRequest('u1'), 'already_open');
  });

  test('any other failure (e.g. rate limit) is thrown with its message', async () => {
    fake.queue({ error: { message: 'You are doing that too often. Please wait a few minutes and try again.' } });
    await assert.rejects(support.openSupportRequest('u1'), /too often/);
  });

  test('loadSupportInbox: open requests oldest first, each with that member\'s thread only', async () => {
    fake.queue(
      { data: [
        { id: 'r1', user_id: 'u1', created_at: '2026-10-01T09:00:00Z', profiles: { handle: 'ann', display_name: 'Ann' } },
        { id: 'r2', user_id: 'u2', created_at: '2026-10-01T10:00:00Z', profiles: null },
      ] },
      { data: [
        { id: 'm1', user_id: 'u1', body: 'help', sender: 'user', created_at: '2026-10-01T09:00:00Z' },
        { id: 'm2', user_id: 'u2', body: 'hi', sender: 'user', created_at: '2026-10-01T10:00:00Z' },
        { id: 'm3', user_id: 'u1', body: 'sure', sender: 'agent', created_at: '2026-10-01T09:05:00Z' },
      ] },
    );
    const inbox = await support.loadSupportInbox();
    assert.ok(fake.has('eq', 'status', 'open'));
    assert.ok(fake.has('order', 'created_at', { ascending: true }));
    assert.deepEqual(fake.args('in', 1), ['user_id', ['u1', 'u2']]);
    assert.equal(inbox.length, 2);
    assert.deepEqual(inbox[0].messages.map((m) => m.id), ['m1', 'm3']);
    assert.equal(inbox[0].handle, 'ann');
    assert.equal(inbox[0].displayName, 'Ann');
    assert.deepEqual(inbox[1].messages.map((m) => m.id), ['m2']);
    assert.equal(inbox[1].handle, 'member', 'a request whose profile is hidden still renders');
  });

  test('an empty inbox does not run the second query', async () => {
    fake.queue({ data: [] });
    assert.deepEqual(await support.loadSupportInbox(), []);
    assert.equal(fake.calls.length, 1);
  });

  test('loadSupportInbox throws on error (so the screen shows retry, not a fake empty inbox)', async () => {
    fake.queue({ error: { message: 'permission denied' } });
    await assert.rejects(support.loadSupportInbox(), /permission denied/);
  });

  test('replyToSupport stores a trimmed staff message for the member; blank is ignored', async () => {
    await support.replyToSupport('u1', '  On it!  ');
    assert.deepEqual(fake.args('insert', 0), [{ user_id: 'u1', body: 'On it!', sender: 'agent' }]);
    fake.reset();
    await support.replyToSupport('u1', '   ');
    assert.equal(fake.calls.length, 0);
  });

  test('closeSupportRequest marks it closed with who/when', async () => {
    await support.closeSupportRequest('r1', 'adm');
    const patch = fake.args('update', 0)![0] as Record<string, unknown>;
    assert.equal(patch.status, 'closed');
    assert.equal(patch.closed_by, 'adm');
    assert.ok(typeof patch.closed_at === 'string' && !Number.isNaN(Date.parse(patch.closed_at as string)));
    assert.ok(fake.has('eq', 'id', 'r1'));
  });
});
