-- Profiles: one row per auth.users row. Everything the frontend calls
-- "role: admin | user | new" lives here.
--
-- Mapping to the frontend's three quick-login personas (see src/state/store.ts):
--   superadmin -> role = 'superadmin'
--   user       -> role = 'user', has posts / conversations / accepted guidelines
--   newuser    -> role = 'user', post_count = 0 and guidelines_accepted_at is null
-- "new" is a derived UI state, not a stored role -- see backend/README.md.

create table public.profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  username               citext not null unique,
  handle                 citext not null unique,
  display_name           text not null,
  role                   user_role not null default 'user',
  avatar_url             text,
  is_suspended           boolean not null default false,
  suspended_at           timestamptz,
  suspended_by           uuid references public.profiles (id),
  guidelines_accepted_at timestamptz,
  post_count             integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile + app role for each auth.users row. post_count is a denormalised counter of forum threads/replies, maintained by trigger.';
comment on column public.profiles.role is
  'Only two real roles. There is no admin-facing way to promote a user to superadmin; it is set manually by an operator.';

create index profiles_role_idx on public.profiles (role);

create table public.deleted_profiles (
  id            uuid primary key,
  username      citext not null,
  handle        citext not null,
  display_name  text not null,
  removed_by    uuid references public.profiles (id),
  removed_at    timestamptz not null default now(),
  reason        text
);

comment on table public.deleted_profiles is
  'Tombstones for "Remove" in Admin > Members. We keep an audit trail instead of a hard delete, unlike the prototype, because chats/threads/items need a stable author to display against.';
