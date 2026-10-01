-- Found by the 13.4 browser run-through: when a moderator REMOVES an item, the owner was never told.
-- resolve_moderation_flag() closes the flag (which inserts the "A moderator removed your post" notification
-- referencing the item) and THEN deletes the item, and notifications.item_id cascades on delete, so the
-- notification vanished with it. A removal notification must not reference the item that is about to be
-- deleted (the 0019 notify_item_deleted trigger already does this for the direct-delete path).

create or replace function public.notify_flag_resolved()
returns trigger language plpgsql security definer set search_path = public as $$
declare o record;
begin
  if old.status::text <> 'pending' or new.status::text not in ('approved', 'removed') then return new; end if;
  select * into o from public.flag_target_owner(new.target_type::text, new.target_id);
  if o.owner_id is null then return new; end if;

  insert into public.notifications (user_id, type, title, body, item_id)
  values (o.owner_id, 'moderation',
          case when new.status::text = 'approved' then 'Review complete: your post stays up'
               else 'A moderator removed your post' end,
          o.title,
          case when new.status::text = 'removed' then null else o.item_id end);
  return new;
end;
$$;
