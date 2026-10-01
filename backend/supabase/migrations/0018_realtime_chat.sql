-- Phase 5.3: live chat.
--
-- supabase_realtime started with no tables, so postgres_changes subscriptions
-- never fired. Add the two chat tables. Realtime evaluates RLS per subscriber,
-- so a user only receives rows they can already SELECT
-- (messages_participants_select / conversations participant policies);
-- nothing here widens access.

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
