-- Community forum. Mirrors `Thread` / `Reply` in src/data/constants.ts.
-- Suspending a thread hides it from non-admins (see visibleThreads in
-- src/state/selectors.ts); deleting it is a real delete, matching the
-- prototype's "permanently deleted by Super Admin" behaviour.

create table public.forum_threads (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles (id),
  tag         forum_tag not null default 'Question',
  status      forum_thread_status not null default 'live',
  title       text not null check (char_length(btrim(title)) > 0),
  body        text not null check (char_length(btrim(body)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index forum_threads_tag_idx on public.forum_threads (tag);
create index forum_threads_status_idx on public.forum_threads (status);
create index forum_threads_author_idx on public.forum_threads (author_id);

create table public.forum_replies (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.forum_threads (id) on delete cascade,
  author_id   uuid not null references public.profiles (id),
  body        text not null check (char_length(btrim(body)) > 0),
  created_at  timestamptz not null default now()
);

create index forum_replies_thread_idx on public.forum_replies (thread_id, created_at);
