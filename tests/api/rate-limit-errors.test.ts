/// <reference types="node" />
import { fake } from './setup';
import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as items from '../../src/api/items';
import * as conv from '../../src/api/conversations';
import * as forum from '../../src/api/forum';
import * as support from '../../src/api/support';

/**
 * The database rate-limits inserts per user (migration 0025) by raising
 * "You are doing that too often...". Every write path must hand that message to the UI
 * unchanged, so the user sees why their action was refused rather than a generic failure.
 */
const TOO_OFTEN = 'You are doing that too often. Please wait a few minutes and try again.';

describe('rate-limit errors reach the user', () => {
  beforeEach(() => fake.reset());

  const cases: [string, () => Promise<unknown>][] = [
    ['create a report', () => items.createItem({ kind: 'lost', category: 'Other', title: 't', locationText: 'l', lat: null, lng: null, occurredOn: null, description: null, reporterId: 'u1' })],
    ['claim an item', () => items.claimItem('i1', 'r1', 'u1')],
    ['flag an item', () => items.flagItem('i1', 'spam', 'u1')],
    ['send a chat message', () => conv.sendMessage('c1', 'u1', 'hi')],
    ['start a thread', () => forum.createThread('u1', 'Title', 'Body', 'Question')],
    ['reply to a thread', () => forum.replyToThread('t1', 'u1', 'hi')],
    ['vote helpful', () => forum.toggleThreadHelpful('t1', 'u1')],
    ['send a support message', () => support.sendSupportMessage('u1', 'help')],
  ];

  for (const [name, run] of cases) {
    test(`${name}: the database's message is passed through verbatim`, async () => {
      // toggleThreadHelpful first looks for an existing vote (no error), then inserts (error).
      if (name === 'vote helpful') fake.queue({ data: null });
      fake.queue({ error: { message: TOO_OFTEN } });
      await assert.rejects(run(), { message: TOO_OFTEN });
    });
  }
});
