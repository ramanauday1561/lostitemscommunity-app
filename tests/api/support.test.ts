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

  describe('findMatchingFaq', () => {
    const faq = [
      { id: 'f1', keywords: ['claim', 'owner'], question: 'q1', answer: 'a1' },
      { id: 'f2', keywords: ['photo', 'upload'], question: 'q2', answer: 'a2' },
    ];

    test('matches against EVERY entry, not just the first one', async () => {
      fake.queue({ data: faq });
      assert.equal((await support.findMatchingFaq('upload'))?.id, 'f2');
    });

    test('matching is case-insensitive and substring-based', async () => {
      fake.queue({ data: faq });
      assert.equal((await support.findMatchingFaq('  OWN '))?.id, 'f1');
    });

    test('no match, or a blank term, gives null (blank makes no request)', async () => {
      fake.queue({ data: faq });
      assert.equal(await support.findMatchingFaq('refund'), null);
      fake.reset();
      assert.equal(await support.findMatchingFaq('   '), null);
      assert.equal(fake.calls.length, 0);
    });

    test('entries with no keywords array are skipped safely', async () => {
      fake.queue({ data: [{ id: 'f0', keywords: null }, ...faq] });
      assert.equal((await support.findMatchingFaq('photo'))?.id, 'f2');
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

  test('sendFaqResponse stores the answer as a bot message', async () => {
    await support.sendFaqResponse('u1', 'f1', 'Here is how');
    assert.deepEqual(fake.args('insert'), [{ user_id: 'u1', body: 'Here is how', sender: 'bot' }]);
    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(support.sendFaqResponse('u1', 'f1', 'x'), /denied/);
  });
});
