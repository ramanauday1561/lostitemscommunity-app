/// <reference types="node" />
import { fake } from '../api/setup';
import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { waitFor } from './waitFor';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

const item = (over: Record<string, unknown> = {}) => ({
  id: 'FOUND-1', dbId: 'item-uuid', reporterId: 'rep', title: 'Wallet', kind: 'Found', by: 'cara', status: 'Active',
  place: 'x', date: '', cat: 'Wallets', icon: 'wallet', desc: '', photos: [], ...over,
});

function claimant(convos: unknown[]) {
  const store = new Store();
  store.setState({ authMode: 'supabase', screen: 'found', role: 'user', suTerms: true, sel: 'FOUND-1',
    profile: { id: 'me', role: 'user', handle: 'ann' } as any, dbItems: [item()] as any, convos } as any);
  return store;
}

describe('claiming an item I already claimed', () => {
  beforeEach(() => fake.reset());
  afterEach(() => new Promise((r) => setTimeout(r, 100)));

  test('no conversation yet: the button claims', async () => {
    const store = claimant([]);
    const v = buildVals(store);
    assert.equal(v.claimLabel, 'This is mine');
    v.claim();
    await waitFor(() => fake.calls.length >= 1, 'claim request');
    assert.equal(fake.calls[0].name, 'conversations');
  });

  test('a conversation exists (even from an earlier visit): the button opens it instead of re-claiming', async () => {
    const store = claimant([{ id: 'conv-1', itemId: 'item-uuid', with: 'cara', item: 'Wallet', icon: 'wallet', unread: 0, time: '', msgs: [] }]);
    const v = buildVals(store);
    assert.equal(v.claimLabel, 'Open chat with finder');
    v.claim();
    assert.equal(store.state.sheet, 'chat');
    assert.equal(store.state.activeConvo, 'conv-1');
    await new Promise((r) => setTimeout(r, 150));
    assert.ok(!fake.calls.some((c) => c.ops.some(([m]) => m === 'upsert')), 'no second claim is sent');
  });

  test("someone else's conversation about another item does not count", () => {
    const store = claimant([{ id: 'conv-9', itemId: 'other-uuid', with: 'x', item: 'y', icon: 'z', unread: 0, time: '', msgs: [] }]);
    assert.equal(buildVals(store).claimLabel, 'This is mine');
  });
});
