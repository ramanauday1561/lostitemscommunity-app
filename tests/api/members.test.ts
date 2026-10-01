/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as members from '../../src/api/members';

describe('members api', () => {
  beforeEach(() => fake.reset());

  test('loadMembers returns profiles newest first, [] when empty, and throws on error', async () => {
    fake.queue({ data: [{ id: 'u1' }] });
    assert.deepEqual(await members.loadMembers(), [{ id: 'u1' }]);
    assert.ok(fake.has('order', 'created_at', { ascending: false }));

    fake.queue({ data: null });
    assert.deepEqual(await members.loadMembers(), []);

    fake.queue({ error: { message: 'denied' } });
    await assert.rejects(members.loadMembers());
  });

  describe('searchMembers', () => {
    test('blank query falls back to the full list (no filter)', async () => {
      fake.queue({ data: [] });
      await members.searchMembers('   ');
      assert.ok(!fake.methods(0).includes('or'));
    });

    test('searches username, handle and display_name', async () => {
      fake.queue({ data: [] });
      await members.searchMembers(' ann ');
      assert.deepEqual(fake.args('or'), ['username.ilike.%ann%,handle.ilike.%ann%,display_name.ilike.%ann%']);
    });

    test('strips filter-syntax characters so a term cannot add or break filters', async () => {
      fake.queue({ data: [] });
      await members.searchMembers('a,role.eq.superadmin)%');
      const [expr] = fake.args('or') as [string];
      // ',', '(', ')' and '%' are removed from the term, so it stays one literal and exactly 3 filters remain.
      const t = 'arole.eq.superadmin';
      assert.equal(expr, `username.ilike.%${t}%,handle.ilike.%${t}%,display_name.ilike.%${t}%`);
    });

    test('a term made only of stripped characters behaves like a blank query', async () => {
      fake.queue({ data: [] });
      await members.searchMembers('%,()');
      assert.ok(!fake.methods(0).includes('or'));
    });
  });

  test('suspend and restore flip is_suspended on that member only', async () => {
    await members.suspendMember('u1');
    assert.deepEqual(fake.args('update', 0), [{ is_suspended: true }]);
    await members.restoreMember('u1');
    assert.deepEqual(fake.args('update', 1), [{ is_suspended: false }]);
    assert.ok(fake.calls.every((c) => c.ops.some(([m, a]) => m === 'eq' && a[0] === 'id' && a[1] === 'u1')));
  });

  test('removeMember currently only suspends (it does not delete the profile or auth user)', async () => {
    await members.removeMember('u1');
    assert.deepEqual(fake.args('update'), [{ is_suspended: true }]);
    assert.ok(!fake.methods(0).includes('delete'));
  });

  test('suspend/restore/remove throw on error', async () => {
    for (const fn of [members.suspendMember, members.restoreMember, members.removeMember]) {
      fake.queue({ error: { message: 'denied' } });
      await assert.rejects(fn('u1'));
    }
  });

  test('getMember returns the profile, or null on error', async () => {
    fake.queue({ data: { id: 'u1' } });
    assert.deepEqual(await members.getMember('u1'), { id: 'u1' });
    fake.queue({ error: { message: 'not found' } });
    assert.equal(await members.getMember('u1'), null);
  });
});
