-- Functions & triggers.

-- 1. generic updated_at stamper -----------------------------------------
create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.forum_threads
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ad_placements
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.faq_entries
  for each row execute function public.set_updated_at();


-- 2. auth.users -> profiles --------------------------------------------
-- Username/handle default to the local part of the email; the frontend's
-- signup form (Signup.tsx) should pass a chosen username/handle via
-- auth.signUp(..., { data: { username, handle, display_name } }) and this
-- trigger prefers that when present.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta        jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  base_handle text := coalesce(meta ->> 'handle', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, username, handle, display_name)
  values (
    new.id,
    coalesce(meta ->> 'username', base_handle),
    base_handle,
    coalesce(meta ->> 'display_name', base_handle)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 3. human-readable display ids ------------------------------------------
create function public.set_item_display_id()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then
    new.display_id := case new.kind
      when 'lost' then 'LOST-' || nextval('public.lost_item_seq')
      else 'FOUND-' || nextval('public.found_item_seq')
    end;
  end if;
  return new;
end;
$$;

create trigger set_item_display_id before insert on public.items
  for each row execute function public.set_item_display_id();

create sequence public.ad_placement_seq start 1;

create function public.set_ad_display_id()
returns trigger language plpgsql as $$
begin
  if new.display_id is null then
    new.display_id := 'AD-' || lpad(nextval('public.ad_placement_seq')::text, 2, '0');
  end if;
  return new;
end;
$$;

create trigger set_ad_display_id before insert on public.ad_placements
  for each row execute function public.set_ad_display_id();


-- 4. profiles.post_count -- keeps "New user" (fresh) detection cheap ------
-- (fresh == role = 'user' and post_count = 0 and guidelines_accepted_at is null)
create function public.bump_post_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set post_count = post_count + 1 where id = new.author_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set post_count = greatest(post_count - 1, 0) where id = old.author_id;
  end if;
  return null;
end;
$$;

create trigger bump_post_count_threads
  after insert or delete on public.forum_threads
  for each row execute function public.bump_post_count();

create trigger bump_post_count_replies
  after insert or delete on public.forum_replies
  for each row execute function public.bump_post_count();


-- 5. moderation resolution -- keeps the "approve/remove" side effects in
-- one place instead of duplicated app logic (see modStats / decide() in
-- src/state/selectors.ts: approve unflags, remove hard-deletes the item or
-- suspends the thread).
create function public.resolve_moderation_flag(flag_id uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  f public.moderation_flags%rowtype;
  actor uuid := auth.uid();
begin
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
