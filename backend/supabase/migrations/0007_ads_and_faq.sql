-- Ad monetisation. Mirrors `Campaign` / `Ad` in src/data/constants.ts and the
-- Admin > Ads screen + ad editor sheet.

create table public.ad_campaigns (
  id          uuid primary key default gen_random_uuid(),
  key         citext not null unique,       -- "keysmart" -- what the ad editor's picker keys off
  name        text not null,                -- "KeySmart tags -- 20% off"
  advertiser  text not null,
  icon        text not null,
  rate_label  text not null,                -- "$14 CPM" (display copy)
  cpm         numeric(10, 2) not null,
  created_at  timestamptz not null default now()
);

create type ad_screen as enum ('Home', 'Registry', 'Forum', 'Report success');

create table public.ad_placements (
  id             uuid primary key default gen_random_uuid(),
  display_id     text not null unique,      -- "AD-01"
  campaign_id    uuid not null references public.ad_campaigns (id),
  screen         ad_screen not null unique, -- one live placement per screen slot, matching the prototype's 4 fixed slots
  slot           text not null,             -- "Below community activity"
  format         text not null,             -- "Native strip"
  size           text not null,             -- "320 x 104"
  duration_days  integer not null check (duration_days > 0),
  starts_at      date not null default current_date,
  is_live        boolean not null default true,
  revenue        numeric(12, 2) not null default 0,
  impressions    integer not null default 0,
  ctr            numeric(5, 2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.ad_placements.duration_days is
  'Relaunching/editing a placement resets starts_at to today and is_live to true -- see saveAd() in src/state/selectors.ts. days_left is computed, not stored (see 0012_views.sql).';
comment on column public.ad_placements.revenue is
  'Aggregated ad-server metrics. In production these are written by a scheduled sync job / edge function, not by the client.';

-- Support bot FAQ, admin-editable instead of hardcoded (src/data/constants.ts FAQ[]).
create table public.faq_entries (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  keywords   text[] not null default '{}',
  answer     text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
