/// <reference types="node" />
import '../api/setup';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

/** The demo registry: a post by someone else, which we open in different statuses. */
function demo(status: string, extra: Record<string, unknown> = {}) {
  const store = new Store();
  const item = store.state.lost.find((i) => i.by !== 'simple.user')!;
  store.setState({
    screen: 'lost', role: 'user', sheet: 'detail', sel: item.id,
    lost: store.state.lost.map((i) => (i.id === item.id ? { ...i, status } : i)), ...extra,
  } as any);
  return { store, id: item.id };
}

describe('claiming a post that is no longer open', () => {
  test('an Active post can be claimed', () => {
    const v = buildVals(demo('Active').store);
    assert.equal(v.canClaim, true);
    assert.equal(v.claimClosedNote, '');
  });

  for (const [status, note] of [['Reunited', /already been reunited/], ['Resolved', /closed by its owner/]] as const) {
    test(`a ${status} post has no claim button and says why (demo mode too)`, () => {
      const v = buildVals(demo(status).store);
      assert.equal(v.canClaim, false);
      assert.match(v.claimClosedNote, note);
    });
  }

  test('someone who already claimed it can still open their chat', () => {
    const { store, id } = demo('Reunited');
    store.setState({ claimed: { [id]: true } } as any);
    const v = buildVals(store);
    assert.equal(v.canClaim, true);
    assert.equal(v.claimLabel, 'Open chat with finder');
    assert.equal(v.claimClosedNote, '', 'no "closed" note next to a usable chat button');
  });

  test('the owner never sees a claim button on their own post', () => {
    const store = new Store();
    const mine = store.state.lost.find((i) => i.by === 'simple.user')!;
    store.setState({ screen: 'lost', role: 'user', sheet: 'detail', sel: mine.id } as any);
    assert.equal(buildVals(store).canClaim, false);
  });
});
