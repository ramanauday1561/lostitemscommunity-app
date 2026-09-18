import type { AdminMember, AdminStats, FlagStatus, ModerationFlag } from './admin';

/**
 * Demo data, transcribed from the prototype's own fixtures (FLAGGED, LOST,
 * FOUND, THREADS, CONVOS, MEMBERS in "Lost Items App v3 (native).dc.html").
 *
 * The database is empty, so every screen that reads it renders an empty
 * state and reads as broken. This fills the app out so the flows can be
 * walked through and reviewed before the real data exists.
 *
 * DEMO_MODE is the single switch. Turn it off and every screen goes back
 * to Supabase - the live calls were not deleted, only short-circuited at
 * the top of each fetcher in admin.ts and registry.ts.
 */
export const DEMO_MODE = true;

/* ------------------------------------------------------------------ items */

export type DemoItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  status: 'Active' | 'Resolved' | 'Reunited' | 'Flagged';
  kind: 'Lost' | 'Found';
  icon: string;
  by: string;
  desc: string;
};

export const DEMO_FOUND: DemoItem[] = [
  { id: 'FOUND-2018', title: 'Black Wallet', location: 'Riverside Park bench', date: '11 Jun 2024', status: 'Active', kind: 'Found', icon: 'wallet-outline', by: 'j.rivera', desc: 'Handed in at the park office. Cards inside, no cash. Owner name partially legible.' },
  { id: 'FOUND-2015', title: 'Silver Watch', location: 'Coffee shop on 5th Ave', date: '09 Jun 2024', status: 'Active', kind: 'Found', icon: 'watch-outline', by: 'cafe.5th', desc: 'Left on a window table. Metal strap, small scratch on the clasp.' },
  { id: 'FOUND-2009', title: 'iPhone 15', location: 'Union Square subway station', date: '06 Jun 2024', status: 'Active', kind: 'Found', icon: 'phone-portrait-outline', by: 'subway.finder', desc: 'Locked screen, blue case. Held at the station desk pending verification.' },
  { id: 'FOUND-1998', title: 'Car Keys with Fob', location: 'Parking lot B', date: '31 May 2024', status: 'Resolved', kind: 'Found', icon: 'key-outline', by: 'lotb.security', desc: 'Returned to owner after fob serial matched the report.' },
  { id: 'FOUND-1990', title: 'Student ID Card', location: 'City College cafeteria', date: '28 May 2024', status: 'Active', kind: 'Found', icon: 'card-outline', by: 'campus.desk', desc: 'Card is intact. Waiting for the registered student to claim it.' },
];

export const DEMO_LOST: DemoItem[] = [
  { id: 'LOST-1031', title: 'Samsung Galaxy S24', location: 'Bus 14, evening route', date: '05 Jun 2024', status: 'Flagged', kind: 'Lost', icon: 'phone-portrait-outline', by: 'alex.j', desc: 'Left on the rack above the seat. Black case, cracked corner.' },
  { id: 'LOST-1029', title: 'Prescription glasses', location: 'City library, 2nd floor', date: '04 Jun 2024', status: 'Active', kind: 'Lost', icon: 'glasses-outline', by: 'm.okafor', desc: 'Tortoise frames in a hard black case.' },
  { id: 'LOST-1024', title: 'Blue Jansport backpack', location: 'Central Station platform 3', date: '02 Jun 2024', status: 'Active', kind: 'Lost', icon: 'bag-outline', by: 'simple.user', desc: 'Notebook and a grey hoodie inside.' },
  { id: 'LOST-1018', title: 'Grey tabby cat, no collar', location: 'Oak Street', date: '29 May 2024', status: 'Reunited', kind: 'Lost', icon: 'paw-outline', by: 'd.pham', desc: 'Answers to Miso. Found by a neighbour two streets away.' },
];

export const DEMO_ITEMS: DemoItem[] = [...DEMO_LOST, ...DEMO_FOUND];

/* ------------------------------------------------------------------ forum */

export type DemoReply = { user: string; ini: string; time: string; text: string };
export type DemoThread = {
  id: string;
  user: string;
  ini: string;
  meta: string;
  tag: 'Sighting' | 'Reunited' | 'Question';
  title: string;
  text: string;
  replies: DemoReply[];
};

export const DEMO_THREADS: DemoThread[] = [
  {
    id: '1', user: 'Joyce', ini: 'JO', meta: '09:00 AM · Central district', tag: 'Sighting',
    title: 'Rolex Submariner — possible match at Central Station',
    text: 'Great news! I think I saw this matching description at the Central Station desk. Worth calling before you travel over.',
    replies: [
      { user: 'Marcus', ini: 'MA', time: '09:14 AM', text: 'I was there this morning — the desk does hold watches in a sealed bag. Ask for the lost property window, not the ticket office.' },
      { user: 'Joyce', ini: 'JO', time: '09:22 AM', text: 'Exactly. Bring ID and anything with the serial on it, they check before handing anything over.' },
      { user: 'Priya', ini: 'PR', time: '10:03 AM', text: 'Called them, they still have it. Owner has been notified through the app.' },
    ],
  },
  {
    id: '2', user: 'Gladyce', ini: 'GL', meta: '08:45 AM · Verified', tag: 'Reunited',
    title: 'MacBook Pro 16 returned to its owner',
    text: 'Verified ownership serial number matches. Owner contacted successfully and collected it this morning.',
    replies: [
      { user: 'Elbert', ini: 'EL', time: '09:02 AM', text: 'This is the third laptop reunited this month. The serial check makes it so much easier.' },
      { user: 'Owner', ini: 'DA', time: '11:20 AM', text: 'That was mine — thank you all. Two years of work on that drive.' },
    ],
  },
  {
    id: '3', user: 'Elbert', ini: 'EL', meta: 'Yesterday · Riverside', tag: 'Question',
    title: 'How long does the desk hold handed-in items?',
    text: 'Dropped a wallet at the park office last week and it is still showing Active. Does the holding period reset after a claim?',
    replies: [
      { user: 'Sara', ini: 'SV', time: 'Yesterday', text: 'Most desks hold items 90 days. The status only flips to Resolved once a claim is verified by a moderator.' },
    ],
  },
];

/* --------------------------------------------------------------- messages */

export type DemoMessage = { from: 'me' | 'them'; text: string; time: string };
export type DemoConvo = {
  id: string;
  itemId: string;
  with: string;
  item: string;
  icon: string;
  unread: number;
  time: string;
  msgs: DemoMessage[];
};

export const DEMO_CONVOS: DemoConvo[] = [
  {
    id: 'c1', itemId: 'FOUND-2015', with: 'cafe.5th', item: 'Silver Watch', icon: 'watch-outline', unread: 2, time: '09:15',
    msgs: [
      { from: 'me', text: "Hi, I think the watch you handed in is mine. Lost it near 5th Ave on Sunday.", time: '09:02' },
      { from: 'them', text: "Could be! Can you tell me what's engraved on the back?", time: '09:11' },
      { from: 'them', text: "I'm at the café until 6 today if you want to collect it.", time: '09:15' },
    ],
  },
  {
    id: 'c2', itemId: 'FOUND-1990', with: 'campus.desk', item: 'Student ID Card', icon: 'card-outline', unread: 0, time: 'Yesterday',
    msgs: [
      { from: 'them', text: "Your ID is at the cafeteria desk. Bring any second ID and it's yours.", time: '16:40' },
      { from: 'me', text: "Perfect, I'll come by tomorrow morning. Thank you!", time: '17:02' },
    ],
  },
];

/* ------------------------------------------------------------------ admin */

export const DEMO_MEMBERS: AdminMember[] = [
  { id: 'm1', username: 'alex.j', full_name: 'Alex Jordan', role: 'member', is_suspended: false, city: null, created_at: '2024-03-04T09:00:00Z' },
  { id: 'm2', username: 'subway.finder', full_name: 'Subway Finder', role: 'member', is_suspended: true, city: null, created_at: '2024-01-18T09:00:00Z' },
  { id: 'm3', username: 'emily.c', full_name: 'Emily Chen', role: 'member', is_suspended: false, city: null, created_at: '2024-05-22T09:00:00Z' },
  { id: 'm4', username: 'user', full_name: 'Simple User', role: 'member', is_suspended: false, city: null, created_at: '2024-02-11T09:00:00Z' },
  { id: 'm5', username: 'm.okafor', full_name: 'Marina Okafor', role: 'member', is_suspended: false, city: null, created_at: '2024-06-02T09:00:00Z' },
];

const flag = (
  id: string,
  reason: string,
  created_at: string,
  status: FlagStatus,
  item: { short_code: string; title: string } | null,
  thread: { title: string } | null,
): ModerationFlag => ({
  id,
  reason,
  status,
  created_at,
  target_type: item ? 'item' : 'thread',
  item_id: item ? id : null,
  thread_id: thread ? id : null,
  reply_id: null,
  profile_id: null,
  flagged_by: null,
  items: item ? { id, title: item.title, short_code: item.short_code, kind: 'lost' } : null,
  forum_threads: thread ? { id, title: thread.title, topic: 'Forum' } : null,
});

export const DEMO_FLAGS: ModerationFlag[] = [
  flag('f1', 'Unverified ownership claim', '2024-06-05T09:00:00Z', 'pending', { short_code: 'LOST-1031', title: 'Samsung Galaxy S24' }, null),
  flag('f2', 'Suspicious contact info', '2024-06-06T09:00:00Z', 'pending', { short_code: 'FOUND-2009', title: 'iPhone 15' }, null),
  flag('f3', 'Spam / Repeated links', '2024-06-07T09:00:00Z', 'pending', null, { title: 'Lost: Vintage Polaroid Camera' }),
  flag('f4', 'Resolved by moderator', '2024-05-30T09:00:00Z', 'approved', { short_code: 'FOUND-1998', title: 'Car Keys with Fob' }, null),
  flag('f5', 'Duplicate report', '2024-05-28T09:00:00Z', 'removed', { short_code: 'LOST-1018', title: 'Grey tabby cat, no collar' }, null),
];

export const DEMO_STATS: AdminStats = {
  active_lost: 1293,
  active_found: 412,
  recovered: 256,
  members: 857,
  members_today: 12,
  suspended: 1,
  flags_pending: DEMO_FLAGS.filter((f) => f.status === 'pending').length,
  flags_approved: DEMO_FLAGS.filter((f) => f.status === 'approved').length,
  flags_removed: DEMO_FLAGS.filter((f) => f.status === 'removed').length,
  threads_active: 142,
  matches_confirmed: 88,
  revenue_month: 12450,
  impressions_month: 129600,
  clicks_month: 3400,
  campaigns_live: 4,
};

/* --------------------------------------------- registry rows for the app */

/**
 * The same demo items in the shape the registry screen expects from
 * Supabase, so that screen needs no special-casing beyond one early return.
 */
export const DEMO_REGISTRY = DEMO_ITEMS.map((it, i) => ({
  id: it.id,
  short_code: it.id,
  reporter_id: `demo-${i}`,
  kind: it.kind.toLowerCase() as 'lost' | 'found',
  title: it.title,
  description: it.desc,
  category_id: null,
  location_text: it.location,
  latitude: null,
  longitude: null,
  date_occurred: null,
  status: it.status === 'Active' || it.status === 'Flagged' ? 'active' : 'resolved',
  moderation_status: it.status === 'Flagged' ? 'flagged' : 'visible',
  flagged_count: it.status === 'Flagged' ? 1 : 0,
  // Newest first, matching the order the real query returns.
  created_at: new Date(Date.parse(`${it.date} 12:00:00 GMT`) || Date.now() - i * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  categories: null,
}));
