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

export interface AnalysisData {
  weeklyReports: WeeklyReportCount[];
  keywords: ModerationKeyword[];
}

// Fetch reports grouped by day for the current week
export async function getWeeklyReportCounts(): Promise<WeeklyReportCount[]> {
  const { data, error } = await supabase
    .from('weekly_report_counts')
    .select('*')
    .order('day', { ascending: true });

  if (error) {
    console.error('Failed to fetch weekly report counts:', error);
    return [];
  }
  return data || [];
}

// Fetch flagged keywords and hit counts
export async function getModerationKeywords(): Promise<ModerationKeyword[]> {
  const { data, error } = await supabase
    .from('moderation_keywords')
    .select('*')
    .order('hits', { ascending: false });

  if (error) {
    console.error('Failed to fetch moderation keywords:', error);
    return [];
  }
  return data || [];
}

// Fetch complete analysis data
export async function getAnalysisData(): Promise<AnalysisData> {
  const [weeklyReports, keywords] = await Promise.all([
    getWeeklyReportCounts(),
    getModerationKeywords(),
  ]);

  return {
    weeklyReports,
    keywords,
  };
}
