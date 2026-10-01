import { supabase } from '../lib/supabase';

export interface WeeklyReportCount {
  day: string | null;
  reports: number | null;
}

/** A flagged keyword and how often it was hit. The table's columns are `keyword` / `hit_count`;
 *  this is the shape the screen reads. */
export interface ModerationKeyword {
  word: string;
  hits: number;
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
    .order('hit_count', { ascending: false });

  if (error) throw error;
  return (data || []).map((r) => ({ word: r.keyword, hits: r.hit_count }));
}
