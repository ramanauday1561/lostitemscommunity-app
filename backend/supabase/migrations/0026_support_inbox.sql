-- 11.3 "Talk to a human": a support inbox a superadmin can answer.
--
-- * support_requests: one OPEN request per member (partial unique index); the member opens it by
--   tapping "Talk to a human", a superadmin closes it.
-- * Superadmins reply by inserting a support_messages row with sender = 'agent' for that member;
--   a trigger turns that into an in-app notification for the member (12.3 delivers it live, and the client
--   reloads the support thread when one arrives).
-- * Closes the gap noted in 14.7: members could previously label their OWN messages 'agent'
--   (impersonating staff). Members may now only write 'user' / 'bot' rows.

create table public.support_requests (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  status     text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  closed_at  timestamptz,
  closed_by  uuid references public.profiles (id) on delete set null
);

create unique index support_requests_one_open_per_user on public.support_requests (user_id) where status = 'open';
create index support_requests_status_idx on public.support_requests (status, created_at);
create index support_requests_closed_by_idx on public.support_requests (closed_by);

alter table public.support_requests enable row level security;

create policy support_requests_select on public.support_requests
  for select using ((select auth.uid()) = user_id or public.is_superadmin());
-- A member may only open a request for themselves, and only as 'open'.
create policy support_requests_insert_own on public.support_requests
  for insert with check ((select auth.uid()) = user_id and status = 'open');
-- Only a superadmin closes one.
create policy support_requests_close on public.support_requests
  for update using (public.is_superadmin()) with check (public.is_superadmin());

-- Members write 'user'/'bot' rows only; staff replies ('agent') come from a superadmin.
drop policy support_messages_insert_own on public.support_messages;
create policy support_messages_insert_own on public.support_messages
  for insert with check (
    ((select auth.uid()) = user_id and sender in ('user', 'bot'))
    or public.is_superadmin()
  );

create trigger rate_limit_support_requests before insert on public.support_requests
  for each row execute function public.rate_limit_insert('support_requests', '5', '3600');

-- A staff reply tells the member (delivered in-app, live, by the 12.3 realtime subscription).
create function public.notify_support_reply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sender <> 'agent' then return new; end if;
  insert into public.notifications (user_id, type, title, body)
  values (new.user_id, 'system', 'Support replied', left(new.body, 140));
  return new;
end;
$$;
revoke execute on function public.notify_support_reply() from public, anon, authenticated;

create trigger notify_support_reply after insert on public.support_messages
  for each row execute function public.notify_support_reply();

