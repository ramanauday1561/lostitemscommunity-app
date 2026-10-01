-- Phase 14: server-side username login + login rate limiting.
--
-- Problem (found in the 14.7 audit): email_for_username() was callable by anyone, signed in or
-- not, and returns the EMAIL for a username. Anyone able to guess a username got that user's
-- email address. It exists only so the login screen can turn "ann" into "ann@example.com".
--
-- Fix: that lookup now happens inside the `login` Edge Function (backend/functions/login),
-- which holds the service role key, throttles attempts, and returns only a session or one
-- generic error. This migration adds the throttle table + atomic counter the function uses and
-- lets the service role call email_for_username. It does NOT yet take that function away from
-- anon/authenticated: the already-deployed app still calls it, so 0024 revokes it once the new
-- client (which uses the login function) is live. username_available() stays public: signup needs
-- it and it only reveals existence.

create table public.auth_throttle (
  key          text primary key,                       -- e.g. 'ip:1.2.3.4' or 'id:ann'
  window_start timestamptz not null default now(),
  attempts     integer     not null default 0
);
alter table public.auth_throttle enable row level security; -- no policies: only service_role (bypasses RLS) can touch it

-- Counts one attempt for `p_key` in a fixed window and says whether it is still within `p_limit`.
-- One atomic upsert, so concurrent attempts can't both slip under the limit.
create function public.auth_throttle_hit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  a integer;
begin
  insert into public.auth_throttle as t (key, window_start, attempts)
  values (p_key, now(), 1)
  on conflict (key) do update set
    attempts     = case when t.window_start < now() - make_interval(secs => p_window_seconds) then 1 else t.attempts + 1 end,
    window_start = case when t.window_start < now() - make_interval(secs => p_window_seconds) then now() else t.window_start end
  returning t.attempts into a;

  if random() < 0.02 then  -- keep the table small without a cron job
    delete from public.auth_throttle where window_start < now() - interval '1 day';
  end if;

  return a <= p_limit;
end;
$$;
revoke all on function public.auth_throttle_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.auth_throttle_hit(text, integer, integer) to service_role;

-- The login function (service role) resolves usernames through this existing function.
grant execute on function public.email_for_username(citext) to service_role;
