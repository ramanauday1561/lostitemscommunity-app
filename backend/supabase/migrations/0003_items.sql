-- Lost & found registry. A single table with a `kind` discriminator, matching
-- the frontend's `Item` type (src/data/constants.ts) which is shared between
-- st.lost and st.found.

create sequence public.lost_item_seq start 1031;
create sequence public.found_item_seq start 2018;

create table public.items (
  id             uuid primary key default gen_random_uuid(),
  display_id     text not null unique,          -- "LOST-1031" / "FOUND-2018"
  kind           item_kind not null,
  status         item_status not null default 'active',
  title          text not null,
  category       item_category not null,
  icon           text not null default 'inventory_2',  -- Material icon name shown in the UI
  location_text  text not null,
  location_lat   numeric(9, 6),
  location_lng   numeric(9, 6),
  occurred_on    date,
  description    text,
  reporter_id    uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.items is
  'Lost + found reports. kind picks which registry tab it appears in; status drives the badge and the moderation queue.';
comment on column public.items.status is
  'active/resolved/reunited are owner-driven (see setStatus in store.ts); flagged is moderation-driven and pulls the item into moderation_flags.';

create index items_kind_status_idx on public.items (kind, status);
create index items_reporter_idx on public.items (reporter_id);
create index items_search_idx on public.items using gin (
  to_tsvector('english', title || ' ' || location_text || ' ' || display_id)
);

create table public.item_photos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items (id) on delete cascade,
  storage_path text not null,     -- path inside the `item-photos` storage bucket
  position    smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index item_photos_item_idx on public.item_photos (item_id, position);
