-- Extensions & shared enum types.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive email/username/handle

create type user_role as enum ('user', 'superadmin');

create type item_kind as enum ('lost', 'found');

create type item_status as enum ('active', 'resolved', 'reunited', 'flagged');

create type item_category as enum (
  'Electronics', 'Wallets', 'Keys', 'Bags', 'Documents', 'Pets', 'Other'
);

create type forum_tag as enum ('Sighting', 'Reunited', 'Question');

create type forum_thread_status as enum ('live', 'suspended');

create type moderation_target as enum ('item', 'forum_thread');

create type moderation_status as enum ('pending', 'approved', 'removed');

create type notification_type as enum ('message', 'match', 'moderation', 'system');

create type support_sender as enum ('user', 'bot', 'agent');
