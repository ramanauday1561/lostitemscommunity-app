-- Phase 14: close the email-lookup hole (follow-up to 0023).
--
-- Apply ONLY after the client that signs in through the `login` Edge Function is deployed
-- (web + any EAS update): until then the live app still resolves usernames with this RPC, and
-- revoking it would break username login. Afterwards, email_for_username is callable by the
-- service role only, so nobody can turn a guessed username into an email address.

revoke execute on function public.email_for_username(citext) from public, anon, authenticated;
grant execute on function public.email_for_username(citext) to service_role;
