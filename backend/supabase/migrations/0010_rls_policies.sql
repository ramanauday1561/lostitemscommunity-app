-- Row Level Security. Two roles only:
--   * any authenticated user -- reads public content, writes/edits their own
--   * superadmin              -- full read/write everywhere (Admin > * screens)
--
-- is_superadmin() is SECURITY DEFINER so it can read public.profiles without
-- being blocked by the RLS policy it is used inside of (avoids the classic
-- "policy on profiles queries profiles" recursion).

create function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'superadmin'
  );
$$;

create function public.current_profile_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

alter table public.profiles            enable row level security;
alter table public.deleted_profiles    enable row level security;
alter table public.items               enable row level security;
alter table public.item_photos         enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.forum_threads       enable row level security;
alter table public.forum_replies       enable row level security;
alter table public.moderation_flags    enable row level security;
alter table public.moderation_keywords enable row level security;
alter table public.ad_campaigns        enable row level security;
alter table public.ad_placements       enable row level security;
alter table public.faq_entries         enable row level security;
alter table public.notifications       enable row level security;
alter table public.support_messages    enable row level security;
alter table public.audit_log           enable row level security;

-- profiles ----------------------------------------------------------------
create policy profiles_select_all on public.profiles
  for select using (true);                          -- names/handles are public (chat, forum, registry "by")
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = 'user');
create policy profiles_update_superadmin on public.profiles
  for update using (public.is_superadmin());
create policy profiles_delete_superadmin on public.profiles
  for delete using (public.is_superadmin());

create policy deleted_profiles_superadmin on public.deleted_profiles
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- items ---------------------------------------------------------------------
create policy items_select_public on public.items
  for select using (status <> 'flagged' or reporter_id = auth.uid() or public.is_superadmin());
create policy items_insert_own on public.items
  for insert with check (auth.uid() = reporter_id);
create policy items_update_own on public.items
  for update using (auth.uid() = reporter_id)
  with check (auth.uid() = reporter_id and status in ('active', 'resolved', 'reunited'));
create policy items_update_superadmin on public.items
  for update using (public.is_superadmin());
create policy items_delete_own on public.items
  for delete using (auth.uid() = reporter_id);
create policy items_delete_superadmin on public.items
  for delete using (public.is_superadmin());

create policy item_photos_select on public.item_photos
  for select using (true);
create policy item_photos_write_owner on public.item_photos
  for all using (exists (select 1 from public.items i where i.id = item_id and i.reporter_id = auth.uid()))
  with check (exists (select 1 from public.items i where i.id = item_id and i.reporter_id = auth.uid()));
create policy item_photos_superadmin on public.item_photos
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- conversations & messages: participants only, no superadmin override --
-- (Admin > Messages is the superadmin's own inbox, not a global read of
-- everyone's DMs -- see roleState()/buildVals() in the frontend).
create policy conversations_participants on public.conversations
  for select using (auth.uid() in (reporter_id, claimant_id));
create policy conversations_insert_claimant on public.conversations
  for insert with check (auth.uid() = claimant_id);

create policy messages_participants_select on public.messages
  for select using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.reporter_id, c.claimant_id)
  ));
create policy messages_participants_insert on public.messages
  for insert with check (
    auth.uid() = sender_id and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.reporter_id, c.claimant_id)
    )
  );
create policy messages_mark_read on public.messages
  for update using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and auth.uid() in (c.reporter_id, c.claimant_id)
  ));

-- forum -----------------------------------------------------------------
create policy forum_threads_select on public.forum_threads
  for select using (status = 'live' or author_id = auth.uid() or public.is_superadmin());
create policy forum_threads_insert_own on public.forum_threads
  for insert with check (auth.uid() = author_id);
create policy forum_threads_update_own on public.forum_threads
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy forum_threads_moderate on public.forum_threads
  for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy forum_replies_select on public.forum_replies
  for select using (exists (
    select 1 from public.forum_threads t where t.id = thread_id
      and (t.status = 'live' or t.author_id = auth.uid() or public.is_superadmin())
  ));
create policy forum_replies_insert_own on public.forum_replies
  for insert with check (auth.uid() = author_id);
create policy forum_replies_moderate on public.forum_replies
  for delete using (public.is_superadmin());

-- moderation --------------------------------------------------------------
create policy moderation_flags_insert on public.moderation_flags
  for insert with check (auth.uid() = flagged_by or flagged_by is null);
create policy moderation_flags_select_own on public.moderation_flags
  for select using (flagged_by = auth.uid() or public.is_superadmin());
create policy moderation_flags_superadmin on public.moderation_flags
  for update using (public.is_superadmin()) with check (public.is_superadmin());
create policy moderation_flags_delete_superadmin on public.moderation_flags
  for delete using (public.is_superadmin());

create policy moderation_keywords_superadmin on public.moderation_keywords
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- ads & faq: public read (they render in the app for every role), writes
-- restricted to superadmin ------------------------------------------------
create policy ad_campaigns_read on public.ad_campaigns for select using (true);
create policy ad_campaigns_superadmin on public.ad_campaigns
  for insert with check (public.is_superadmin());
create policy ad_campaigns_superadmin_upd on public.ad_campaigns
  for update using (public.is_superadmin());
create policy ad_campaigns_superadmin_del on public.ad_campaigns
  for delete using (public.is_superadmin());

create policy ad_placements_read on public.ad_placements for select using (true);
create policy ad_placements_superadmin on public.ad_placements
  for insert with check (public.is_superadmin());
create policy ad_placements_superadmin_upd on public.ad_placements
  for update using (public.is_superadmin());
create policy ad_placements_superadmin_del on public.ad_placements
  for delete using (public.is_superadmin());

create policy faq_entries_read on public.faq_entries for select using (true);
create policy faq_entries_superadmin on public.faq_entries
  for all using (public.is_superadmin()) with check (public.is_superadmin());

-- notifications, support chat, audit log -----------------------------------
create policy notifications_own on public.notifications
  for select using (auth.uid() = user_id);
create policy notifications_own_update on public.notifications
  for update using (auth.uid() = user_id);
create policy notifications_superadmin on public.notifications
  for all using (public.is_superadmin()) with check (public.is_superadmin());

create policy support_messages_own on public.support_messages
  for select using (auth.uid() = user_id or public.is_superadmin());
create policy support_messages_insert_own on public.support_messages
  for insert with check (auth.uid() = user_id or public.is_superadmin());

create policy audit_log_superadmin on public.audit_log
  for select using (public.is_superadmin());
