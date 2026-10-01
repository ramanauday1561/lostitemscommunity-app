/// <reference types="node" />
import { fake } from '../api/setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';
import { waitFor } from './waitFor';

const member = () => {
  const store = new Store();
  store.setState({ authMode: 'supabase', screen: 'dash', role: 'user', suTerms: true,
    profile: { id: 'u1', role: 'user', handle: 'ann', display_name: 'Ann', username: 'ann', post_count: 0, is_suspended: false, created_at: '2026-01-01T00:00:00Z' } as any } as any);
  return store;
};

describe('buttons show the loader while their request is in flight', () => {
  beforeEach(() => fake.reset());

  test('withPending flags the key for the duration, clears it afterwards, even on failure', async () => {
    const store = member();
    let release!: () => void;
    const p = store.withPending('x', () => new Promise<void>((r) => { release = r; }));
    assert.equal(store.state.pending.x, true);
    release(); await p;
    assert.equal(store.state.pending.x, false);
    await assert.rejects(store.withPending('y', async () => { throw new Error('boom'); }), /boom/);
    assert.equal(store.state.pending.y, false, 'cleared after a failure too');
  });

  test('a second tap while the first is running is ignored', async () => {
    const store = member();
    let calls = 0; let release!: () => void;
    const slow = () => { calls++; return new Promise<void>((r) => { release = r; }); };
    const first = store.withPending('save', slow);
    await store.withPending('save', slow);
    assert.equal(calls, 1);
    release(); await first;
  });

  test('"I understand" shows the loader while saving, then closes the sheet', async () => {
    const store = member();
    store.setState({ sheet: 'guidelines' } as any);
    fake.queue({ data: { id: 'u1', guidelines_accepted_at: '2026-10-01T00:00:00Z' } });
    buildVals(store).acceptGuidelines();
    assert.equal(buildVals(store).guidelinesLoading, true);
    await waitFor(() => store.state.sheet === null);
    await waitFor(() => !buildVals(store).guidelinesLoading);
  });

  test('"I understand" from the sign-up form (nobody signed in yet) closes the sheet and ticks the box', async () => {
    const store = new Store();
    store.setState({ authMode: 'supabase', screen: 'signup', sheet: 'guidelines', suTerms: false } as any);
    buildVals(store).acceptGuidelines();
    await waitFor(() => store.state.sheet === null);
    assert.equal(store.state.suTerms, true);
    assert.equal(fake.calls.length, 0, 'nothing to save without an account');
  });

  test('Publish shows the loader, and "Posted to the forum" only appears once it has really posted', async () => {
    const store = member();
    store.setState({ sheet: 'newthread', ntTitle: 'Hello', ntBody: 'World', ntTag: 'Question' } as any);
    fake.queue({ error: { message: 'rate limited' } });
    buildVals(store).publishThread();
    assert.equal(buildVals(store).publishLoading, true);
    await waitFor(() => !buildVals(store).publishLoading);
    assert.match(store.state.toast, /rate limited/);
    assert.notEqual(store.state.toast, 'Posted to the forum.');
  });

  test('Submit report shows the loader only on the last step', async () => {
    const store = member();
    store.setState({ sheet: 'report', step: 2, rTitle: 'Bag', rCat: 'Bags', rPlace: 'Station' } as any);
    fake.queue({ data: { id: 'x', display_id: 'LOST-1' } });
    buildVals(store).reportNext();
    assert.equal(buildVals(store).reportBtnLoading, true);
    await waitFor(() => !buildVals(store).reportBtnLoading);
  });

  test('login, sign-up and reset buttons follow their busy flags', () => {
    const store = new Store();
    store.setState({ busy: true, fpBusy: true } as any);
    const v = buildVals(store);
    assert.equal(v.signInLoading, true);
    assert.equal(v.signupLoading, true);
    assert.equal(v.fpLoading, true);
  });

  test('logout clears pending flags', () => {
    const store = member();
    store.setState({ pending: { claim: true } } as any);
    buildVals(store).logout();
    assert.deepEqual(store.state.pending, {});
  });
});
