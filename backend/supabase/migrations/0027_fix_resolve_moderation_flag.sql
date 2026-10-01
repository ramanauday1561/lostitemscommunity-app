-- Found by the 13.4 browser run-through: resolve_moderation_flag() never worked. Its
-- `case when approve then 'approved' else 'removed' end` is text, and moderation_flags.status is the
-- enum moderation_status, so every call failed with 42804 ("column status is of type moderation_status
-- but expression is of type text"). The client had been editing the flag row directly instead, which
-- skipped the audit log and (for approvals) never restored the item. Cast it.
--
-- Also: an item could be sent to the queue twice (two pending flags for one target). One pending flag
-- per target is enough, and approving/removing it should close the lot.

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
    set status = (case when approve then 'approved' else 'removed' end)::public.moderation_status,
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

-- One pending flag per target: drop older duplicates (keep the newest), then enforce it.
delete from public.moderation_flags a
  using public.moderation_flags b
  where a.status = 'pending' and b.status = 'pending'
    and a.target_type = b.target_type and a.target_id = b.target_id
    and (a.created_at, a.id) < (b.created_at, b.id);

create unique index moderation_flags_one_pending_per_target
  on public.moderation_flags (target_type, target_id) where status = 'pending';
