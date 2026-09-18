import { DEMO_FLAGS, DEMO_MEMBERS, DEMO_MODE, DEMO_STATS } from '@/lib/demo';
import { supabase } from '@/lib/supabase';

/** Shape returned by the admin_dashboard_stats() RPC. */
export type AdminStats = {
  active_lost: number;
  active_found: number;
  recovered: number;
  members: number;
  members_today: number;
  suspended: number;
  flags_pending: number;
  flags_approved: number;
  flags_removed: number;
  threads_active: number;
  matches_confirmed: number;
  revenue_month: number;
  impressions_month: number;
  clicks_month: number;
  campaigns_live: number;
};

export type FlagStatus = 'pending' | 'approved' | 'removed';

export type ModerationFlag = {
  id: string;
  reason: string;
  status: FlagStatus;
  created_at: string;
  target_type: string | null;
  item_id: string | null;
  thread_id: string | null;
  reply_id: string | null;
  profile_id: string | null;
  flagged_by: string | null;
  items: { id: string; title: string; short_code: string; kind: string } | null;
  forum_threads: { id: string; title: string; topic: string } | null;
};

export type AdminMember = {
  id: string;
  username: string;
  full_name: string | null;
  role: 'member' | 'admin';
  is_suspended: boolean;
  city: string | null;
  created_at: string;
};

export async function fetchStats(): Promise<AdminStats> {
  if (DEMO_MODE) return DEMO_STATS;
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  return data as unknown as AdminStats;
}

export async function fetchFlags(status: FlagStatus): Promise<ModerationFlag[]> {
  if (DEMO_MODE) return DEMO_FLAGS.filter((f) => f.status === status);
  const { data, error } = await supabase
    .from('moderation_flags')
    .select(
      'id,reason,status,created_at,target_type,item_id,thread_id,reply_id,profile_id,flagged_by,' +
        'items(id,title,short_code,kind),forum_threads(id,title,topic)',
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ModerationFlag[];
}

/**
 * Resolving a flag is two writes plus an audit row. "Remove" soft-deletes
 * the target — the schema never hard-deletes content.
 */
export async function resolveFlag(flag: ModerationFlag, decision: 'approved' | 'removed', adminId: string) {
  const { error: flagErr } = await supabase
    .from('moderation_flags')
    .update({ status: decision, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', flag.id);
  if (flagErr) throw flagErr;

  if (decision === 'removed') {
    if (flag.item_id) {
      const { error } = await supabase
        .from('items')
        .update({ moderation_status: 'removed', status: 'removed' })
        .eq('id', flag.item_id);
      if (error) throw error;
    } else if (flag.thread_id) {
      const { error } = await supabase
        .from('forum_threads')
        .update({ is_removed: true, moderation_status: 'removed' })
        .eq('id', flag.thread_id);
      if (error) throw error;
    } else if (flag.reply_id) {
      const { error } = await supabase.from('forum_replies').update({ is_removed: true }).eq('id', flag.reply_id);
      if (error) throw error;
    } else if (flag.profile_id) {
      const { error } = await supabase.from('profiles').update({ is_suspended: true }).eq('id', flag.profile_id);
      if (error) throw error;
    }
  }

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action_type: decision === 'removed' ? 'content_removed' : 'flag_approved',
    target_type: flag.target_type ?? 'unknown',
    target_id: flag.item_id ?? flag.thread_id ?? flag.reply_id ?? flag.profile_id,
    notes: flag.reason,
  } as never);
}

export async function fetchMembers(search: string): Promise<AdminMember[]> {
  if (DEMO_MODE) {
    const t = search.trim().toLowerCase();
    return t
      ? DEMO_MEMBERS.filter((m) => `${m.username} ${m.full_name ?? ''}`.toLowerCase().includes(t))
      : DEMO_MEMBERS;
  }
  let q = supabase
    .from('profiles')
    .select('id,username,full_name,role,is_suspended,city,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const term = search.trim().replace(/[,()*]/g, ' ').trim();
  if (term) q = q.or(`username.ilike.%${term}%,full_name.ilike.%${term}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminMember[];
}

export async function setSuspended(member: AdminMember, suspended: boolean, adminId: string) {
  const { error } = await supabase.from('profiles').update({ is_suspended: suspended }).eq('id', member.id);
  if (error) throw error;

  await supabase.from('admin_audit_log').insert({
    admin_id: adminId,
    action_type: suspended ? 'member_suspended' : 'member_restored',
    target_type: 'profile',
    target_id: member.id,
    notes: member.username,
  } as never);
}

export async function broadcast(title: string, body: string): Promise<number> {
  const { data, error } = await supabase.rpc('admin_broadcast', { p_title: title, p_body: body });
  if (error) throw error;
  return (data as number) ?? 0;
}
