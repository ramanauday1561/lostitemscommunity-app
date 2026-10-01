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
