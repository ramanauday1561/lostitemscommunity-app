-- Every report must now be pinned on the map, and the registry can be searched by distance.

-- 1. Posts made before pins were required have no coordinates and can never appear in a nearby search.
--    Remove them (photos, conversations and notifications cascade). Photo files already uploaded to the
--    'item-photos' storage bucket are NOT removed by this; clean those up from the dashboard if needed.
delete from public.items where location_lat is null or location_lng is null;

alter table public.items
  alter column location_lat set not null,
  alter column location_lng set not null,
  add constraint items_location_range_chk
    check (location_lat between -90 and 90 and location_lng between -180 and 180);

create index items_location_lat_idx on public.items (location_lat);

-- 2. Nearby search. Returns the ids of one page of matching items, nearest first, with their distance in
--    metres; the app then loads those rows (photos, reporter) in a second query. SECURITY INVOKER (the
--    default) so row level security still hides flagged items from everyone but their reporter/superadmins.
--    Plain haversine plus a latitude bounding box that the index above can serve -- no PostGIS needed.
create or replace function public.items_near(
  p_lat      double precision,
  p_lng      double precision,
  p_radius_m double precision,
  p_kind     public.item_kind,
  p_status   public.item_status default null,
  p_query    text default null,
  p_limit    integer default 21,
  p_offset   integer default 0
)
returns table (id uuid, distance_m double precision)
language sql
stable
set search_path = public
as $$
  select i.id, d.dist
  from public.items i
  cross join lateral (
    select 6371000 * 2 * asin(least(1, sqrt(
      power(sin(radians(i.location_lat - p_lat) / 2), 2)
      + cos(radians(p_lat)) * cos(radians(i.location_lat)) * power(sin(radians(i.location_lng - p_lng) / 2), 2)
    ))) as dist
  ) d
  where i.kind = p_kind
    and (p_status is null or i.status = p_status)
    and i.location_lat between p_lat - degrees(p_radius_m / 6371000.0) and p_lat + degrees(p_radius_m / 6371000.0)
    and d.dist <= p_radius_m
    and (
      p_query is null or p_query = ''
      or i.title ilike '%' || p_query || '%'
      or i.location_text ilike '%' || p_query || '%'
      or i.display_id ilike '%' || p_query || '%'
    )
  order by d.dist, i.id
  limit least(greatest(p_limit, 1), 101)
  offset greatest(p_offset, 0);
$$;

revoke execute on function public.items_near(double precision, double precision, double precision, public.item_kind, public.item_status, text, integer, integer) from public;
grant execute on function public.items_near(double precision, double precision, double precision, public.item_kind, public.item_status, text, integer, integer) to authenticated;
