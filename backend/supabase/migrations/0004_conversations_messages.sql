-- Claim chat: one conversation per (item, claimant) pair. Mirrors `Convo` /
-- `ChatMsg` in src/data/constants.ts, but unread counts are derived from
-- messages.read_at instead of being stored on the conversation.

create table public.conversations (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.items (id) on delete cascade,
  reporter_id   uuid not null references public.profiles (id),   -- who posted the item
  claimant_id   uuid not null references public.profiles (id),   -- who claimed it ("I have found this" / "This is mine")
  created_at    timestamptz not null default now(),
  unique (item_id, claimant_id),
  check (reporter_id <> claimant_id)
);

create index conversations_reporter_idx on public.conversations (reporter_id);
create index conversations_claimant_idx on public.conversations (claimant_id);

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  sender_id        uuid not null references public.profiles (id),
  body             text not null check (char_length(btrim(body)) > 0),
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id) where read_at is null;
