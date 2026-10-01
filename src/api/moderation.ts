import { supabase } from '../lib/supabase';

export interface ModerationFlag {
  id: string;
  target_type: 'item' | 'forum_thread';
  target_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'removed';
  flagged_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  // Denormalized for display
  target_title?: string;
  target_author?: string;
  target_date?: string;
}

interface FlagWithTarget {
  flag: ModerationFlag;
  item?: {
    display_id: string;
    title: string;
    status: string;
  };
  thread?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface ModerationStats {
  pending: number;
  approved: number;
  removed: number;
}

/** Load the moderation queue (all pending flags with target data) */
export async function loadModerationQueue(): Promise<ModerationFlag[]> {
  // Query moderation_flags with joins to get target details
  const { data: flags, error: flagsError } = await supabase
    .from('moderation_flags')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (flagsError) throw new Error(flagsError.message);
  if (!flags) return [];

  // Fetch target details for each flag
  const enriched: ModerationFlag[] = [];

  for (const flag of flags as any[]) {
    if (flag.target_type === 'item') {
      const { data: item } = await supabase
        .from('items')
        .select('display_id, title, reporter_id, created_at')
        .eq('id', flag.target_id)
        .maybeSingle();

      if (item) {
        enriched.push({
          ...flag,
          target_title: item.title,
          target_author: item.reporter_id,
          target_date: item.created_at,
        });
      }
    } else if (flag.target_type === 'forum_thread') {
      const { data: thread } = await supabase
        .from('forum_threads')
        .select('id, title, author_id, created_at')
        .eq('id', flag.target_id)
        .maybeSingle();

      if (thread) {
        enriched.push({
          ...flag,
          target_title: thread.title,
          target_author: thread.author_id,
          target_date: thread.created_at,
        });
      }
    }
  }

  return enriched;
}

/** Get moderation stats (count of pending, approved, removed) */
export async function loadModerationStats(): Promise<ModerationStats> {
  // Count manually since RPC function doesn't exist
  const { count: pendingCount } = await supabase
    .from('moderation_flags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: approvedCount } = await supabase
    .from('moderation_flags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'approved');

  const { count: removedCount } = await supabase
    .from('moderation_flags')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'removed');

  return {
    pending: pendingCount ?? 0,
    approved: approvedCount ?? 0,
    removed: removedCount ?? 0,
  };
}

/** Approve a flag (close it, keep content) */
export async function approveFlag(flagId: string, reviewedBy: string): Promise<void> {
  const { error } = await supabase
    .from('moderation_flags')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', flagId);

  if (error) throw new Error(error.message);
}

/** Remove a flag target (hard delete item or suspend thread, update flag status) */
export async function removeFlag(flagId: string, reviewedBy: string): Promise<void> {
  // First, fetch the flag to know what to delete
  const { data: flag, error: flagError } = await supabase
    .from('moderation_flags')
    .select('*')
    .eq('id', flagId)
    .maybeSingle();

  if (flagError || !flag) throw new Error('Flag not found');

  // Delete/suspend the target
  if (flag.target_type === 'item') {
    const { error: delError } = await supabase
      .from('items')
      .delete()
      .eq('id', flag.target_id);
    if (delError) throw new Error(delError.message);
  } else if (flag.target_type === 'forum_thread') {
    const { error: suspendError } = await supabase
      .from('forum_threads')
      .update({ status: 'suspended' })
      .eq('id', flag.target_id);
    if (suspendError) throw new Error(suspendError.message);
  }

  // Update the flag status
  const { error } = await supabase
    .from('moderation_flags')
    .update({
      status: 'removed',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', flagId);

  if (error) throw new Error(error.message);
}
