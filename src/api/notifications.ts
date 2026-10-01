import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Row = Database['public']['Tables']['notifications']['Row'];

export type NotificationType = Row['type'];

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  itemId: string | null;
  conversationId: string | null;
  isRead: boolean;
  time: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function toAppNotification(r: Row): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body ?? '',
    itemId: r.item_id,
    conversationId: r.conversation_id,
    isRead: r.is_read,
    time: formatTime(r.created_at),
  };
}

/** The 50 most recent notifications for the caller (RLS already limits rows to their own). */
export async function loadNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toAppNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}
