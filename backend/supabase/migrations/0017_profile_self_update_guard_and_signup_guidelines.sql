-- Phase 12.
--
-- 1. Close a hole in profiles_update_self (0010): its WITH CHECK only pins
--    role = 'user', so any signed-in user could PATCH their own row and set
--    is_suspended = false (un-suspending themselves) or forge post_count.
--    A BEFORE UPDATE guard now rejects changes to those moderation/system
--    columns unless the caller is a superadmin, has no JWT (service role /
--    dashboard SQL), or the update comes from another trigger (e.g. the
--    bump_post_count triggers, which run at pg_trigger_depth() > 1).
--
-- 2. Persist "I accept the community guidelines" at signup. The client sends
--    raw_user_meta_data.guidelines_accepted = 'true'; handle_new_user stamps
--    guidelines_accepted_at, so it works even when email confirmation delays
--    the first session.

create or replace function public.guard_profile_self_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or public.is_superadmin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.is_suspended is distinct from old.is_suspended
     or new.suspended_at is distinct from old.suspended_at
     or new.suspended_by is distinct from old.suspended_by
     or new.post_count is distinct from old.post_count then
    raise exception 'not allowed to change role, suspension or post_count' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_self_update on public.profiles;
create trigger guard_profile_self_update before update on public.profiles
  for each row execute function public.guard_profile_self_update();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base_handle text := coalesce(meta ->> 'handle', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, handle, display_name, guidelines_accepted_at)
  values (
    new.id,
    coalesce(meta ->> 'username', base_handle),
    base_handle,
    coalesce(meta ->> 'display_name', base_handle),
    case when meta ->> 'guidelines_accepted' = 'true' then now() end
  );
  return new;
end;
$$;
