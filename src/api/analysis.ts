import { supabase } from '../lib/supabase';

export interface WeeklyReportCount {
  day: string;
  count: number;
  day_of_week: number;
}

export interface ModerationKeyword {
  word: string;
  hits: number;
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
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Fetch flagged keywords and hit counts
export async function getModerationKeywords(): Promise<ModerationKeyword[]> {
  const { data, error } = await supabase
    .from('moderation_keywords')
    .select('word, hits')
    .order('hits', { ascending: false });

  if (error) throw error;
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
