-- Helpful votes never counted for anyone but the thread's author.
--
-- bump_helpful_count() (an AFTER INSERT/DELETE trigger on forum_thread_votes) updated
-- forum_threads with the VOTER's privileges, and forum_threads_update_own only lets the
-- author update a thread, so for every other voter the UPDATE matched zero rows and
-- helpful_count silently stayed put. Run it as its owner (like the notification triggers) and
-- make it trigger-only. The guard from 0021 lets it through (it runs at trigger depth > 1).

alter function public.bump_helpful_count() security definer set search_path = public;
revoke execute on function public.bump_helpful_count() from public, anon, authenticated;
