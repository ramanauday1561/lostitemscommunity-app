-- Moderation queue. Mirrors `FlaggedRecord` in src/data/constants.ts and the
-- Admin > Moderation screen. Polymorphic over items and forum threads so one
-- queue serves both "flag this item" (Detail sheet) and future forum
-- flagging, instead of two near-identical tables.

create table public.moderation_flags (
  id            uuid primary key default gen_random_uuid(),
  target_type   moderation_target not null,
  target_id     uuid not null,
  reason        text not null,
  status        moderation_status not null default 'pending',
  flagged_by    uuid references public.profiles (id),   -- null = system-generated (e.g. keyword filter)
  reviewed_by   uuid references public.profiles (id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.moderation_flags is
  'One row per report. Approve keeps the content and closes the flag; Delete/Remove also hard-deletes (items) or suspends (threads) the target -- see the app functions in 0009.';

create index moderation_flags_status_idx on public.moderation_flags (status);
create index moderation_flags_target_idx on public.moderation_flags (target_type, target_id);

-- Keyword-triggered auto-flagging (Admin > Analysis > "Flagged keywords").
create table public.moderation_keywords (
  id         uuid primary key default gen_random_uuid(),
  keyword    text not null unique,
  hit_count  integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.moderation_keywords is
  'Tracked phrases (e.g. "payment upfront", "send deposit", "meet alone"). hit_count is incremented whenever a new item/thread/message body matches -- wire this to a scheduled job or an edge function, not client code.';
