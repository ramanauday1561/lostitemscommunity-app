/// <reference types="node" />
import '../api/setup';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

const dbThread = (over: Record<string, unknown> = {}) => ({
  id: 't-uuid-1', title: 'Blue umbrella near the station', body: 'Saw one on platform 3.', tag: 'Sighting', status: 'live',
  author_id: 'u2', author_handle: 'cara', author_display_name: 'Cara Diaz', created_at: '10:19 AM', reply_count: 1, helpful_vote_count: 0, user_voted_helpful: false, ...over,
});

describe('forum thread sheet in Supabase mode', () => {
  function open(extra: Record<string, unknown> = {}) {
    const store = new Store();
    store.setState({
      screen: 'forum', role: 'user', suTerms: true,
      profile: { id: 'u1', role: 'user', handle: 'ann' } as any,
      dbThreads: [dbThread()] as any, dbReplies: [], sheet: 'thread', activeThread: 't-uuid-1', ...extra,
    } as any);
    return store;
  }

  test('shows the real thread: title, body, author and reply count (it used to open blank)', () => {
    const t = buildVals(open()).thread as any;
    assert.equal(t.title, 'Blue umbrella near the station');
    assert.equal(t.text, 'Saw one on platform 3.');
    assert.equal(t.user, 'cara');
    assert.equal(t.ini, 'CA');
    assert.equal(t.meta, '10:19 AM · Cara Diaz');
    assert.equal(t.tag, 'Sighting');
    assert.equal(t.replyLabel, '0 replies', 'counts the loaded replies');
  });

  test('the suspend/restore label follows the real thread status', () => {
    assert.equal((buildVals(open()).thread as any).suspendLabel, 'Suspend post');
    const s = open({ dbThreads: [dbThread({ status: 'suspended' })] });
    assert.equal((buildVals(s).thread as any).suspendLabel, 'Restore post');
  });

  test('an unknown/closed thread id is an empty thread, not a crash', () => {
    const v = buildVals(open({ activeThread: 'nope' }));
    assert.equal(v.hasThread, false);
    assert.deepEqual((v.thread as any).replies, []);
  });
});

describe('suspended threads', () => {
  const mk = (role: 'admin' | 'user') => {
    const store = new Store();
    store.setState({ screen: 'forum', role, suTerms: true, forumTag: 'All',
      profile: { id: 'u1', role: role === 'admin' ? 'superadmin' : 'user', handle: 'x' } as any,
      dbThreads: [dbThread({ id: 'a', status: 'suspended' }), dbThread({ id: 'b' })] as any } as any);
    return buildVals(store);
  };
  test('an admin sees them (with the suspended flag) so they can be restored', () => {
    const rows = mk('admin').threads;
    assert.deepEqual(rows.map((r) => r.suspended), [true, false]);
  });
  test('a member does not', () => {
    assert.deepEqual(mk('user').threads.map((r) => r.id), ['b']);
  });
});

describe('admin buttons on a forum card (Supabase mode)', () => {
  const mk = (status: string) => {
    const store = new Store();
    store.setState({ screen: 'forum', role: 'admin', suTerms: true, forumTag: 'All',
      profile: { id: 'adm', role: 'superadmin', handle: 'boss' } as any, dbThreads: [dbThread({ status })] as any } as any);
    return buildVals(store).threads[0];
  };
  test('Suspend post and Delete really act on the thread (they used to just say "not yet implemented")', async () => {
    const { fake } = await import('../api/setup');
    fake.reset();
    mk('live').suspend();
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(fake.calls[0].name, 'forum_threads');
    assert.deepEqual(fake.args('update', 0), [{ status: 'suspended' }]);
    fake.reset();
    mk('suspended').suspend();
    await new Promise((r) => setTimeout(r, 30));
    assert.deepEqual(fake.args('update', 0), [{ status: 'live' }]);
    fake.reset();
    mk('live').remove();
    await new Promise((r) => setTimeout(r, 30));
    assert.ok(fake.calls[0].ops.some(([m]) => m === 'delete'));
  });
});
