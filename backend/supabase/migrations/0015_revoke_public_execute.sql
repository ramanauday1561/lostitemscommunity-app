-- Postgres grants EXECUTE to the PUBLIC pseudo-role by default, which
-- every role (including anon/authenticated) inherits regardless of an
-- explicit per-role revoke. Revoke from PUBLIC first, then grant back only
-- where a client legitimately calls the function over RPC.

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.current_profile_id() from public;

revoke execute on function public.resolve_moderation_flag(uuid, boolean) from public;
grant execute on function public.resolve_moderation_flag(uuid, boolean) to authenticated;

revoke execute on function public.is_superadmin() from public;
grant execute on function public.is_superadmin() to authenticated;
