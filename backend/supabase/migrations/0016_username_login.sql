-- Supports two things the app's real Login/Signup screens need that the
-- initial schema didn't provide an RPC for:
--
-- 1. Signing in with a username instead of an email. auth.users is not
--    exposed over PostgREST, so the client can't resolve username -> email
--    itself; this function does it server-side.
-- 2. A duplicate-username check at signup time, so the UI can show
--    "that username is taken" instead of a raw Postgres constraint error
--    surfacing through supabase.auth.signUp().
--
-- Trade-off, noted deliberately rather than silently: email_for_username()
-- lets an unauthenticated caller learn whether a given username exists
-- (though not the password, and not a different email per wrong guess --
-- Supabase Auth's own "Invalid login credentials" stays generic either
-- way). This is the cost of supporting username login at all; mitigate
-- later with rate limiting (see backend/INTEGRATION_CHECKLIST.md Phase 14).

create or replace function public.email_for_username(p_username citext)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.username = p_username
  limit 1;
$$;

revoke all on function public.email_for_username(citext) from public;
grant execute on function public.email_for_username(citext) to anon, authenticated;

create or replace function public.username_available(p_username citext)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where username = p_username);
$$;

revoke all on function public.username_available(citext) from public;
grant execute on function public.username_available(citext) to anon, authenticated;
