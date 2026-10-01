/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as dashboard from '../../src/api/dashboard';
import * as analysis from '../../src/api/analysis';

describe('dashboard api', () => {
  beforeEach(() => fake.reset());

  test('getMyDashboardStats runs four scoped count queries and maps them', async () => {
    fake.queue({ count: 5 }, { count: 2 }, { count: 1 }, { count: 4 });
    assert.deepEqual(await dashboard.getMyDashboardStats('u1'), {
      totalReports: 5, activeReports: 2, reunited: 1, myThreads: 4,
    });
    assert.equal(fake.calls.length, 4);
    assert.deepEqual(fake.calls.map((c) => c.name), ['items', 'items', 'items', 'forum_threads']);
    assert.ok(fake.has('eq', 'reporter_id', 'u1'));
    assert.ok(fake.has('eq', 'status', 'active'));
    assert.ok(fake.has('eq', 'status', 'reunited'));
    assert.ok(fake.has('eq', 'author_id', 'u1'));
  });

  test('null counts become 0', async () => {
    assert.deepEqual(await dashboard.getMyDashboardStats('u1'), { totalReports: 0, activeReports: 0, reunited: 0, myThreads: 0 });
  });

  test('getAdminDashboardStats maps the view row, zeroing nulls', async () => {
    fake.queue({ data: { active_lost: 7, recovered: null, active_members: 3 } });
    assert.deepEqual(await dashboard.getAdminDashboardStats(), { activeLost: 7, recovered: 0, activeMembers: 3 });
    assert.equal(fake.calls[0].name, 'admin_dashboard_stats');
  });

  test('getAdminDashboardStats returns null on error or no row', async () => {
    fake.queue({ error: { message: 'denied' } });
    assert.equal(await dashboard.getAdminDashboardStats(), null);
    fake.queue({ data: null });
    assert.equal(await dashboard.getAdminDashboardStats(), null);
  });
});

describe('analysis api', () => {
  beforeEach(() => fake.reset());

  test('weekly counts are ordered by day ascending; errors give []', async () => {
    fake.queue({ data: [{ day: 'M', reports: 2 }] });
    assert.deepEqual(await analysis.getWeeklyReportCounts(), [{ day: 'M', reports: 2 }]);
    assert.equal(fake.calls[0].name, 'weekly_report_counts');
    assert.ok(fake.has('order', 'day', { ascending: true }));

    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      assert.deepEqual(await analysis.getWeeklyReportCounts(), []);
    } finally { console.error = orig; }
  });

  test('keywords are ordered by hits descending; errors give []', async () => {
    fake.queue({ data: [{ word: 'send deposit', hits: 4 }] });
    assert.equal((await analysis.getModerationKeywords()).length, 1);
    assert.ok(fake.has('order', 'hits', { ascending: false }));

    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ error: { message: 'boom' } });
      assert.deepEqual(await analysis.getModerationKeywords(), []);
    } finally { console.error = orig; }
  });

  test('getAnalysisData combines both, one failing does not lose the other', async () => {
    const orig = console.error; console.error = () => {};
    try {
      fake.queue({ data: [{ day: 'M', reports: 2 }] }, { error: { message: 'boom' } });
      assert.deepEqual(await analysis.getAnalysisData(), { weeklyReports: [{ day: 'M', reports: 2 }], keywords: [] });
    } finally { console.error = orig; }
  });
});
