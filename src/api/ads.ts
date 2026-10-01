import { supabase } from '../lib/supabase';

/** A row of `ad_campaigns` (0007_ads_and_faq.sql). */
export interface AdCampaign {
  id: string;
  /** Stable slug the editor keys off, e.g. "keysmart". */
  key: string;
  name: string;
  advertiser: string;
  icon: string;
  /** Display copy, e.g. "$14 CPM". */
  rate_label: string;
  cpm: number;
  created_at?: string;
}

/** A row of the `ad_placements_with_status` view: the placement joined with its campaign. */
export interface AdPlacementWithStatus {
  id: string;
  display_id: string;
  campaign_id: string;
  screen: 'Home' | 'Registry' | 'Forum' | 'Report success';
  slot: string;
  format: string;
  size: string;
  duration_days: number;
  starts_at: string;
  is_live: boolean;
  revenue: number;
  impressions: number;
  ctr: number;
  days_left: number;
  ended: boolean;
  campaign_key: string;
  campaign_name: string;
  advertiser: string;
  icon: string;
  rate_label: string;
  cpm: number;
}

// Fetch all ad campaigns
export async function getAdCampaigns(): Promise<AdCampaign[]> {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch all ad placements with status
export async function getAdPlacements(): Promise<AdPlacementWithStatus[]> {
  const { data, error } = await supabase
    .from('ad_placements_with_status')
    .select('*')
    .order('screen', { ascending: true });

  if (error) throw error;
  return (data as unknown as AdPlacementWithStatus[]) || [];
}

// Toggle ad live status
export async function toggleAdLive(adId: string, isLive: boolean): Promise<AdPlacementWithStatus> {
  const { data: updated, error: updateError } = await supabase
    .from('ad_placements')
    .update({ is_live: isLive })
    .eq('id', adId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Fetch the full record with status from the view
  const { data, error } = await supabase
    .from('ad_placements_with_status')
    .select('*')
    .eq('id', adId)
    .single();

  if (error) throw error;
  return data as unknown as AdPlacementWithStatus;
}

// Update ad placement (campaign, duration)
export async function updateAdPlacement(
  adId: string,
  campaignId: string,
  durationDays: number
): Promise<AdPlacementWithStatus> {
  const { error: updateError } = await supabase
    .from('ad_placements')
    .update({
      campaign_id: campaignId,
      duration_days: durationDays,
      starts_at: new Date().toISOString().split('T')[0], // Today's date
      is_live: true,
    })
    .eq('id', adId);

  if (updateError) throw updateError;

  // Fetch the full record with status from the view
  const { data, error } = await supabase
    .from('ad_placements_with_status')
    .select('*')
    .eq('id', adId)
    .single();

  if (error) throw error;
  return data as unknown as AdPlacementWithStatus;
}
