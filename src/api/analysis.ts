import { supabase } from '../lib/supabase';

export interface WeeklyReportCount {
  day: string | null;
  reports: number | null;
}

export interface ModerationKeyword {
  keyword?: string;
  word?: string;
  hits?: number;
  hit_count?: number;
}

// Fetch reports grouped by day for the current week
export async function getWeeklyReportCounts(): Promise<WeeklyReportCount[]> {
  const { data, error } = await supabase
    .from('weekly_report_counts')
    .select('*')
    .order('day', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch flagged keywords and hit counts
export async function getModerationKeywords(): Promise<ModerationKeyword[]> {
  const { data, error } = await supabase
    .from('moderation_keywords')
    .select('*')
    .order('hits', { ascending: false });

  if (error) throw error;
  return data || [];
}
