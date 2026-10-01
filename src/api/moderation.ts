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
  /** Human-readable reference: the item's LOST-1031 style id, or 'Forum thread'. */
  target_ref?: string;
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

/** Load the moderation queue: every pending flag with its target's display id, title and author handle.
 *  Flags point at items or threads polymorphically (no foreign key), so targets are fetched in one batched
 *  query per kind rather than one per flag. A flag whose target is gone is dropped. */
export async function loadModerationQueue(): Promise<ModerationFlag[]> {
  const { data: flags, error: flagsError } = await supabase
    .from('moderation_flags')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (flagsError) throw new Error(flagsError.message);
  const rows = (flags ?? []) as any[];
  if (!rows.length) return [];

  const itemIds = rows.filter((f) => f.target_type === 'item').map((f) => f.target_id);
  const threadIds = rows.filter((f) => f.target_type === 'forum_thread').map((f) => f.target_id);
  const handleOf = (p: any) => (Array.isArray(p) ? p[0] : p)?.handle;

  const items = new Map<string, any>();
  if (itemIds.length) {
    const { data, error } = await supabase
      .from('items')
      .select('id, display_id, title, created_at, reporter:profiles!reporter_id(handle)')
      .in('id', itemIds);
    if (error) throw new Error(error.message);
    for (const it of (data ?? []) as any[]) items.set(it.id, it);
  }
  const threads = new Map<string, any>();
  if (threadIds.length) {
    const { data, error } = await supabase
      .from('forum_threads')
      .select('id, title, created_at, author:profiles!author_id(handle)')
      .in('id', threadIds);
    if (error) throw new Error(error.message);
    for (const t of (data ?? []) as any[]) threads.set(t.id, t);
  }

  const enriched: ModerationFlag[] = [];
  for (const flag of rows) {
    if (flag.target_type === 'item') {
      const it = items.get(flag.target_id);
      if (it) enriched.push({ ...flag, target_title: it.title, target_author: handleOf(it.reporter), target_date: it.created_at, target_ref: it.display_id });
    } else {
      const t = threads.get(flag.target_id);
      if (t) enriched.push({ ...flag, target_title: t.title, target_author: handleOf(t.author), target_date: t.created_at, target_ref: 'Forum thread' });
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

/** Approve a flag: closes it and puts the content back (item active / thread live). Done by the
 *  `resolve_moderation_flag` database function so the status change, the audit log entry and the
 *  owner's notification happen together, and only for a superadmin. */
export async function approveFlag(flagId: string): Promise<void> {
  const { error } = await supabase.rpc('resolve_moderation_flag', { flag_id: flagId, approve: true });
  if (error) throw new Error(error.message);
}

/** Remove a flag's target for good (the item or thread is deleted) and close the flag. */
export async function removeFlag(flagId: string): Promise<void> {
  const { error } = await supabase.rpc('resolve_moderation_flag', { flag_id: flagId, approve: false });
  if (error) throw new Error(error.message);
}
