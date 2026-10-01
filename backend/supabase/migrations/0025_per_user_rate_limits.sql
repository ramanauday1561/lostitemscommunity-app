-- Phase 14.1: per-user rate limits on the actions that can be spammed.
--
-- Nothing stopped one account from creating hundreds of reports, messages, flags or claims, and
-- since 0019 a spoofed-looking flag or claim also pings another user. A BEFORE INSERT trigger
-- now counts each user's inserts per table in a fixed window (the same atomic counter that
-- throttles login, public.auth_throttle_hit) and rejects the one over the limit.
--
-- Exempt: superadmins; callers with no JWT (service role / dashboard SQL); and inserts made by
-- other triggers (pg_trigger_depth() > 1). A rejected insert raises, which rolls back that
-- statement's counter bump too, so only accepted actions are counted.
--
--   items               10 / hour     reporting
--   conversations       10 / hour     claiming
--   messages            30 / minute   chat
--   forum_threads        5 / hour
--   forum_replies       30 / hour
--   forum_thread_votes  60 / hour     helpful toggling
--   moderation_flags    10 / hour
--   support_messages    40 / hour     each bot question stores 2 rows

create function public.rate_limit_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or pg_trigger_depth() > 1 or public.is_superadmin() then
    return new;
  end if;
  if not public.auth_throttle_hit('u:' || uid || ':' || tg_argv[0], tg_argv[1]::integer, tg_argv[2]::integer) then
    raise exception 'You are doing that too often. Please wait a few minutes and try again.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;
  return new;
end;
$$;
revoke execute on function public.rate_limit_insert() from public, anon, authenticated;

create trigger rate_limit_items              before insert on public.items              for each row execute function public.rate_limit_insert('items', '10', '3600');
create trigger rate_limit_conversations      before insert on public.conversations      for each row execute function public.rate_limit_insert('conversations', '10', '3600');
create trigger rate_limit_messages           before insert on public.messages           for each row execute function public.rate_limit_insert('messages', '30', '60');
create trigger rate_limit_forum_threads      before insert on public.forum_threads      for each row execute function public.rate_limit_insert('forum_threads', '5', '3600');
create trigger rate_limit_forum_replies      before insert on public.forum_replies      for each row execute function public.rate_limit_insert('forum_replies', '30', '3600');
create trigger rate_limit_forum_thread_votes before insert on public.forum_thread_votes for each row execute function public.rate_limit_insert('forum_thread_votes', '60', '3600');
create trigger rate_limit_moderation_flags   before insert on public.moderation_flags   for each row execute function public.rate_limit_insert('moderation_flags', '10', '3600');
create trigger rate_limit_support_messages   before insert on public.support_messages   for each row execute function public.rate_limit_insert('support_messages', '40', '3600');
