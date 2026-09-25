-- Notifications, support chat and the superadmin audit trail. None of these
-- are in the frontend's mock state yet, but the copy already promises them
-- ("You'll get notifications when potential owners reach out" -- FAQ seed,
-- "Handed to the support team -- they'll reply in your inbox" -- escalate()).

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          notification_type not null,
  title         text not null,
  body          text,
  item_id       uuid references public.items (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index notifications_user_unread_idx on public.notifications (user_id) where is_read = false;

-- Support bot conversation (Misc.tsx SupportSheet). Kept separate from the
-- item-claim `conversations`/`messages` tables because it's 1:1 per user and
-- has a bot participant, not a second profile.
create table public.support_messages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  sender     support_sender not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index support_messages_user_idx on public.support_messages (user_id, created_at);

-- Every superadmin action that changes someone else's data: approve/remove a
-- flag, suspend/remove a member, suspend/delete a thread, toggle/edit an ad.
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references public.profiles (id),
  action      text not null,          -- e.g. 'moderation.approve', 'member.suspend', 'ad.toggle'
  target_type text not null,          -- e.g. 'item', 'forum_thread', 'profile', 'ad_placement'
  target_id   text not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index audit_log_actor_idx on public.audit_log (actor_id, created_at);
create index audit_log_target_idx on public.audit_log (target_type, target_id);
