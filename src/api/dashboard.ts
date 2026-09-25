import { supabase } from '../lib/supabase';

export interface MyDashboardStats {
  activeReports: number;
  reunited: number;
  totalReports: number;
  myThreads: number;
}

/** Powers the member dashboard's stat tiles and "Set up your account" checklist. */
export async function getMyDashboardStats(userId: string): Promise<MyDashboardStats> {
  const [total, active, reunited, threads] = await Promise.all([
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('reporter_id', userId),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('reporter_id', userId).eq('status', 'active'),
    supabase.from('items').select('id', { count: 'exact', head: true }).eq('reporter_id', userId).eq('status', 'reunited'),
    supabase.from('forum_threads').select('id', { count: 'exact', head: true }).eq('author_id', userId),
  ]);

  return {
    totalReports: total.count ?? 0,
    activeReports: active.count ?? 0,
    reunited: reunited.count ?? 0,
    myThreads: threads.count ?? 0,
  };
}

export interface AdminDashboardStats {
  activeLost: number;
  recovered: number;
  activeMembers: number;
}

/** Powers the superadmin dashboard's summary tiles (admin_dashboard_stats view). */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats | null> {
  const { data, error } = await supabase.from('admin_dashboard_stats').select('*').single();
  if (error || !data) return null;
  return {
    activeLost: data.active_lost ?? 0,
    recovered: data.recovered ?? 0,
    activeMembers: data.active_members ?? 0,
  };
}
