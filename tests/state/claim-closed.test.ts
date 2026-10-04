/// <reference types="node" />
import '../api/setup';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../../src/state/store';
import { buildVals } from '../../src/state/selectors';

const ME = { id: 'me', handle: 'me.user', display_name: 'Me', username: 'me', role: 'user' };

function post(status: string, by: string, id = 'LOST-1') {
  return { id, dbId: `uuid-${id}`, reporterId: `r-${by}`, title: 'Blue umbrella', location: 'Central Station', date: '', status, kind: 'Lost', icon: 'inventory_2', by, desc: '' };
}

/** A registry with one post, opened in the detail sheet by `me.user`. */
function open(item: ReturnType<typeof post>, extra: Record<string, unknown> = {}) {
  const store = new Store();
  store.setState({
    screen: 'lost', role: 'user', profile: ME, sheet: 'detail', sel: item.id, dbItems: [item], ...extra,
  } as any);
  return store;
}

describe('claiming a post that is no longer open', () => {
  test('an Active post can be claimed', () => {
    const v = buildVals(open(post('Active', 'someone.else')));
    assert.equal(v.canClaim, true);
    assert.equal(v.claimClosedNote, '');
  });

  for (const [status, note] of [['Reunited', /already been reunited/], ['Resolved', /closed by its owner/]] as const) {
    test(`a ${status} post has no claim button and says why`, () => {
      const v = buildVals(open(post(status, 'someone.else')));
      assert.equal(v.canClaim, false);
      assert.match(v.claimClosedNote, note);
    });
  }

  test('someone who already claimed it can still open their chat', () => {
    const item = post('Reunited', 'someone.else');
    const v = buildVals(open(item, { convos: [{ id: 'c1', itemId: item.dbId, with: 'someone.else', item: item.title, icon: 'inventory_2', unread: 0, time: '', msgs: [] }] }));
    assert.equal(v.canClaim, true);
    assert.equal(v.claimLabel, 'Open chat with finder');
    assert.equal(v.claimClosedNote, '', 'no "closed" note next to a usable chat button');
  });

  test('the owner never sees a claim button on their own post', () => {
    assert.equal(buildVals(open(post('Active', 'me.user'))).canClaim, false);
  });
});
