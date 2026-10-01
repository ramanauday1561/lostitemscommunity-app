-- Phase 12.3: fill the `notifications` table (0008) and publish it over Realtime.
--
-- Users have no INSERT policy on notifications by design, so these triggers run as
-- security definer. Each one is a no-op when the recipient would be the actor.
--
--   messages INSERT            -> 'message'    to the other participant
--   conversations INSERT       -> 'match'      to the item's reporter (someone claimed it)
--   moderation_flags INSERT    -> 'moderation' to the content owner (flagged, under review)
--   moderation_flags -> approved/removed       -> 'moderation' to the content owner
--   items BEFORE DELETE while a flag is pending -> 'moderation' to the reporter. The item is
--       hard-deleted *before* its flag is marked removed (see api/moderation.ts#removeFlag),
--       and notifications.item_id cascades on delete, so this one carries no item_id.

create function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
  recipient uuid;
  sender_handle text;
begin
  select reporter_id, claimant_id, item_id into c from public.conversations where id = new.conversation_id;
  if not found then return new; end if;

  recipient := case when new.sender_id = c.reporter_id then c.claimant_id else c.reporter_id end;
  if recipient is null or recipient = new.sender_id then return new; end if;

  select handle into sender_handle from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, item_id, conversation_id)
  values (recipient, 'message', 'New message from ' || coalesce(sender_handle, 'someone'),
          left(new.body, 140), c.item_id, new.conversation_id);
  return new;
end;
$$;

create trigger notify_new_message after insert on public.messages
  for each row execute function public.notify_new_message();

create function public.notify_new_claim()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  item_title text;
  claimant_handle text;
begin
  if new.reporter_id = new.claimant_id then return new; end if;
  select title into item_title from public.items where id = new.item_id;
  select handle into claimant_handle from public.profiles where id = new.claimant_id;
  insert into public.notifications (user_id, type, title, body, item_id, conversation_id)
  values (new.reporter_id, 'match', coalesce(claimant_handle, 'Someone') || ' claimed your item',
          item_title, new.item_id, new.id);
  return new;
end;
$$;

create trigger notify_new_claim after insert on public.conversations
  for each row execute function public.notify_new_claim();

-- Owner + title of whatever a moderation flag points at.
create function public.flag_target_owner(p_type text, p_id uuid, out owner_id uuid, out title text, out item_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if p_type = 'item' then
    select i.reporter_id, i.title, i.id into owner_id, title, item_id from public.items i where i.id = p_id;
  else
    select t.author_id, t.title, null::uuid into owner_id, title, item_id from public.forum_threads t where t.id = p_id;
  end if;
end;
$$;

create function public.notify_flag_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare o record;
begin
  select * into o from public.flag_target_owner(new.target_type::text, new.target_id);
  if o.owner_id is null or o.owner_id = new.flagged_by then return new; end if;
  insert into public.notifications (user_id, type, title, body, item_id)
  values (o.owner_id, 'moderation', 'Your post was flagged for review', o.title, o.item_id);
  return new;
end;
$$;

create trigger notify_flag_created after insert on public.moderation_flags
  for each row execute function public.notify_flag_created();

create function public.notify_flag_resolved()
returns trigger language plpgsql security definer set search_path = public as $$
declare o record;
begin
  if old.status::text <> 'pending' or new.status::text not in ('approved', 'removed') then return new; end if;
  select * into o from public.flag_target_owner(new.target_type::text, new.target_id);
  if o.owner_id is null then return new; end if; -- target already hard-deleted: handled by notify_item_deleted

  insert into public.notifications (user_id, type, title, body, item_id)
  values (o.owner_id, 'moderation',
          case when new.status::text = 'approved' then 'Review complete: your post stays up'
               else 'A moderator removed your post' end,
          o.title, o.item_id);
  return new;
end;
$$;

create trigger notify_flag_resolved after update of status on public.moderation_flags
  for each row execute function public.notify_flag_resolved();

create function public.notify_item_deleted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from old.reporter_id
     and exists (select 1 from public.moderation_flags
                 where target_type::text = 'item' and target_id = old.id and status::text = 'pending') then
    insert into public.notifications (user_id, type, title, body)
    values (old.reporter_id, 'moderation', 'A moderator removed your post', old.title);
  end if;
  return old;
end;
$$;

create trigger notify_item_deleted before delete on public.items
  for each row execute function public.notify_item_deleted();

-- Trigger-only functions: not callable over the API.
revoke execute on function public.notify_new_message()   from public, anon, authenticated;
revoke execute on function public.notify_new_claim()     from public, anon, authenticated;
revoke execute on function public.notify_flag_created()  from public, anon, authenticated;
revoke execute on function public.notify_flag_resolved() from public, anon, authenticated;
revoke execute on function public.notify_item_deleted()  from public, anon, authenticated;
revoke execute on function public.flag_target_owner(text, uuid) from public, anon, authenticated;

-- Live bell badge.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
