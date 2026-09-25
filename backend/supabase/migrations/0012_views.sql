-- Read-only views backing the Admin dashboard screens. Keeping these as
-- views (not stored/duplicated columns) means the numbers in Admin >
-- Moderation / Analysis / Ads are always derived from the transactional
-- tables, never drift out of sync.

-- Ad placements with the daysLeft/pct/ended fields the Ads screen needs
-- (see adSlots in src/state/selectors.ts) computed instead of stored.
create view public.ad_placements_with_status with (security_invoker = true) as
select
  p.*,
  greatest(p.duration_days - (current_date - p.starts_at)::int, 0) as days_left,
  (current_date - p.starts_at)::int >= p.duration_days as ended,
  c.key as campaign_key, c.name as campaign_name, c.advertiser, c.icon, c.rate_label, c.cpm
from public.ad_placements p
join public.ad_campaigns c on c.id = p.campaign_id;

-- Admin > Moderation counters (modStats: Pending / Approved / Removed).
create view public.moderation_counts with (security_invoker = true) as
select
  count(*) filter (where status = 'pending')  as pending,
  count(*) filter (where status = 'approved') as approved,
  count(*) filter (where status = 'removed')  as removed
from public.moderation_flags;

-- Admin > Analysis "Reports this week" bar chart: items reported per day.
create view public.weekly_report_counts with (security_invoker = true) as
select date_trunc('day', created_at)::date as day, count(*) as reports
from public.items
where created_at >= current_date - interval '7 days'
group by 1
order by 1;

-- Admin > Home summary tiles (adminMetrics: Active lost / Recovered / Scouts online).
create view public.admin_dashboard_stats with (security_invoker = true) as
select
  (select count(*) from public.items where kind = 'lost' and status = 'active')      as active_lost,
  (select count(*) from public.items where kind = 'found' and status = 'reunited')
    + (select count(*) from public.items where kind = 'lost' and status = 'reunited') as recovered,
  (select count(*) from public.profiles where not is_suspended)                       as active_members;

grant select on public.ad_placements_with_status, public.moderation_counts,
  public.weekly_report_counts, public.admin_dashboard_stats to authenticated;
