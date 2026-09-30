import { supabase } from '../lib/supabase';

export interface AdCampaign {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface AdPlacement {
  id: string;
  screen: string;
  slot: string;
  campaign_id: string;
  campaign_name?: string;
  is_live: boolean;
  duration_days: number;
  starts_at: string;
  created_at?: string;
  display_id?: string;
}

export interface AdPlacementWithStatus extends AdPlacement {
  days_left: number;
  status: 'live' | 'scheduled' | 'ended';
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
  return data || [];
}

// Toggle ad live status
export async function toggleAdLive(adId: string, isLive: boolean): Promise<AdPlacementWithStatus> {
  const { data, error } = await supabase
    .from('ad_placements')
    .update({ is_live: isLive })
    .eq('id', adId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update ad placement (campaign, duration)
export async function updateAdPlacement(
  adId: string,
  campaignId: string,
  durationDays: number
): Promise<AdPlacementWithStatus> {
  const { data, error } = await supabase
    .from('ad_placements')
    .update({
      campaign_id: campaignId,
      duration_days: durationDays,
      starts_at: new Date().toISOString().split('T')[0], // Today's date
      is_live: true,
    })
    .eq('id', adId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch ad placement for a specific screen
export async function getAdForScreen(screen: string): Promise<AdPlacementWithStatus | null> {
  const { data, error } = await supabase
    .from('ad_placements_with_status')
    .select('*')
    .eq('screen', screen)
    .eq('is_live', true)
    .single()
    .catch(() => ({ data: null, error: null }));

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
  return data || null;
}
