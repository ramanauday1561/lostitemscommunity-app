-- Fixes for the security advisor findings from the initial migration pass:
--
-- 1. resolve_moderation_flag() is SECURITY DEFINER but had no internal
--    authorization check -- any authenticated caller could invoke it via
--    RPC and resolve/delete arbitrary content. Add an explicit guard.
-- 2. All SECURITY DEFINER / plpgsql functions lacked a pinned search_path,
--    which lets a caller who can create objects earlier in their search_path
--    shadow catalog functions inside the function body.
-- 3. handle_new_user/current_profile_id/resolve_moderation_flag were
--    directly callable via PostgREST RPC by anon/authenticated even though
--    only triggers or superadmin-checked callers should reach them.

create or replace function public.resolve_moderation_flag(flag_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  f public.moderation_flags%rowtype;
  actor uuid := auth.uid();
begin
  if not public.is_superadmin() then
    raise exception 'only a superadmin can resolve moderation flags';
  end if;

  select * into f from public.moderation_flags where id = flag_id;
  if not found then
    raise exception 'moderation flag % not found', flag_id;
  end if;

  update public.moderation_flags
    set status = case when approve then 'approved' else 'removed' end,
        reviewed_by = actor, reviewed_at = now()
    where id = flag_id;

  if f.target_type = 'item' then
    if approve then
      update public.items set status = 'active' where id = f.target_id and status = 'flagged';
    else
      delete from public.items where id = f.target_id;
    end if;
  elsif f.target_type = 'forum_thread' then
    if approve then
      update public.forum_threads set status = 'live' where id = f.target_id;
    else
      delete from public.forum_threads where id = f.target_id;
    end if;
  end if;

  insert into public.audit_log (actor_id, action, target_type, target_id, metadata)
  values (actor, case when approve then 'moderation.approve' else 'moderation.remove' end,
          f.target_type::text, f.target_id::text, jsonb_build_object('flag_id', flag_id));
end;
$$;

alter function public.set_updated_at()        set search_path = public;
alter function public.set_item_display_id()    set search_path = public;
alter function public.set_ad_display_id()      set search_path = public;
alter function public.bump_post_count()        set search_path = public;
alter function public.bump_helpful_count()     set search_path = public;
alter function public.current_profile_id()     set search_path = public;
alter function public.handle_new_user()        set search_path = public;
alter function public.is_superadmin()          set search_path = public;

-- handle_new_user only makes sense fired by the on_auth_user_created
-- trigger; current_profile_id is a convenience nobody calls over RPC.
-- resolve_moderation_flag is now self-guarding but there's no reason to
-- expose it to anon at all.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.current_profile_id() from anon, authenticated;
revoke execute on function public.resolve_moderation_flag(uuid, boolean) from anon;

-- citext was installed into public by `create extension if not exists`
-- with no schema given; move it out so it doesn't pollute the public
-- namespace / exposed API schema. Existing citext columns keep working --
-- Postgres tracks the type by OID, not by search_path.
create schema if not exists extensions;
alter extension citext set schema extensions;
