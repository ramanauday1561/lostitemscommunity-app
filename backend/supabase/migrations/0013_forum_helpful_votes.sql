-- "Helpful" on a forum thread (thumb_up in src/screens/Forum.tsx, `helpful`
-- in src/state/selectors.ts). The prototype only flashes a toast; a real
-- backend needs somewhere to persist it and a way to prevent double-voting.

create table public.forum_thread_votes (
  thread_id  uuid not null references public.forum_threads (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

alter table public.forum_threads add column helpful_count integer not null default 0;

create function public.bump_helpful_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set helpful_count = helpful_count + 1 where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update public.forum_threads set helpful_count = greatest(helpful_count - 1, 0) where id = old.thread_id;
  end if;
  return null;
end;
$$;

create trigger bump_helpful_count
  after insert or delete on public.forum_thread_votes
  for each row execute function public.bump_helpful_count();

alter table public.forum_thread_votes enable row level security;

create policy forum_thread_votes_select on public.forum_thread_votes
  for select using (true);
create policy forum_thread_votes_insert_own on public.forum_thread_votes
  for insert with check (auth.uid() = user_id);
create policy forum_thread_votes_delete_own on public.forum_thread_votes
  for delete using (auth.uid() = user_id);
