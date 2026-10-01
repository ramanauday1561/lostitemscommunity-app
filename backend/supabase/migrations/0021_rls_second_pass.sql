-- Phase 14.7: second pass over the row-level security rules.
--
-- Each fix below closes a hole that was demonstrated on the live project with an
-- impersonated, rolled-back transaction (see the checklist, 14.7). Where a policy can't
-- express "only these columns may change", a BEFORE UPDATE guard does, using the same
-- bypass as 0017: superadmins, callers with no JWT (service role / dashboard SQL) and
-- updates made by other triggers (pg_trigger_depth() > 1, e.g. helpful_count) pass.

-- 1. items: an owner could un-flag their own flagged item (undoing moderation), rewrite its
--    public display_id, move it to another owner or change its kind.
create function public.guard_item_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or public.is_superadmin() then
    return new;
  end if;
  if old.status = 'flagged' then
    raise exception 'this item is under moderator review' using errcode = '42501';
  end if;
  if new.display_id is distinct from old.display_id
     or new.created_at is distinct from old.created_at
     or new.reporter_id is distinct from old.reporter_id
     or new.kind is distinct from old.kind then
    raise exception 'not allowed to change id, owner, kind or creation time' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_item_update before update on public.items
  for each row execute function public.guard_item_update();

-- 2. forum_threads: an author could un-suspend their own suspended thread and forge
--    helpful_count (the votes trigger updates it at depth > 1, so it is unaffected).
create function public.guard_thread_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or public.is_superadmin() then
    return new;
  end if;
  if new.status is distinct from old.status
     or new.helpful_count is distinct from old.helpful_count
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'not allowed to change status, votes, author or creation time' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_thread_update before update on public.forum_threads
  for each row execute function public.guard_thread_update();

-- 3. messages: messages_mark_read let either participant UPDATE any column of any message in
--    the conversation, including rewriting what the OTHER person said. Now the only change a
--    participant may make is stamping read_at, once, on a message someone else sent.
create function public.guard_message_update()
returns trigger language plpgsql set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or auth.uid() is null or public.is_superadmin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.conversation_id is distinct from old.conversation_id
     or new.sender_id is distinct from old.sender_id
     or new.body is distinct from old.body
     or new.created_at is distinct from old.created_at then
    raise exception 'messages cannot be edited' using errcode = '42501';
  end if;
  if old.sender_id = auth.uid() then
    raise exception 'you can only mark other people''s messages as read' using errcode = '42501';
  end if;
  if old.read_at is not null and new.read_at is distinct from old.read_at then
    raise exception 'read receipts cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger guard_message_update before update on public.messages
  for each row execute function public.guard_message_update();

-- 4. conversations: the insert policy only checked claimant_id = me, so anyone could open a
--    conversation naming any user as the item's "reporter" (which now also fires a
--    notification to that user). The reporter must be the item's actual owner, and you can't
--    claim your own item. (The items subquery honours items' RLS, so hidden/flagged items of
--    other people can't be claimed either.)
drop policy conversations_insert_claimant on public.conversations;
create policy conversations_insert_claimant on public.conversations
  for insert with check (
    (select auth.uid()) = claimant_id
    and claimant_id <> reporter_id
    and exists (select 1 from public.items i where i.id = conversations.item_id and i.reporter_id = conversations.reporter_id)
  );

-- 5. moderation_flags: anyone could insert an unattributed flag (flagged_by null), or one that
--    is already approved/removed, which also skews the moderation counts. Flags must be
--    attributable to the caller and start pending.
drop policy moderation_flags_insert on public.moderation_flags;
create policy moderation_flags_insert on public.moderation_flags
  for insert with check (
    flagged_by = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

-- 6. profiles: readable by anonymous visitors, which (with email_for_username, callable by anon)
--    lets anyone list every username and then look up each one's email. Signed-in users still see
--    names/handles (chat, forum, registry); login and signup use SECURITY DEFINER functions.
drop policy profiles_select_all on public.profiles;
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);

-- 7. rls_auto_enable() is a Supabase event-trigger helper, not part of the app API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- 8. Indexes for foreign keys the performance advisor flagged.
create index if not exists ad_placements_campaign_idx on public.ad_placements (campaign_id);
create index if not exists deleted_profiles_removed_by_idx on public.deleted_profiles (removed_by);
create index if not exists forum_replies_author_idx on public.forum_replies (author_id);
create index if not exists forum_thread_votes_user_idx on public.forum_thread_votes (user_id);
create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists moderation_flags_flagged_by_idx on public.moderation_flags (flagged_by);
create index if not exists moderation_flags_reviewed_by_idx on public.moderation_flags (reviewed_by);
create index if not exists notifications_conversation_idx on public.notifications (conversation_id);
create index if not exists notifications_item_idx on public.notifications (item_id);
create index if not exists profiles_suspended_by_idx on public.profiles (suspended_by);
