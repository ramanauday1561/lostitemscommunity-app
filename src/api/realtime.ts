import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export interface IncomingMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export type IncomingNotification = Database['public']['Tables']['notifications']['Row'];

export interface ChatRealtimeHandlers {
  /** A message row visible to this user was inserted (including their own, from any device). */
  onMessage: (m: IncomingMessage) => void;
  /** A conversation involving this user was created (someone claimed an item, or I did). */
  onConversation: () => void;
  /** A notification row for this user was inserted (by a database trigger). */
  onNotification?: (n: IncomingNotification) => void;
}

/**
 * Subscribes to new messages, conversations and notifications. Realtime applies RLS per subscriber, so the
 * callbacks only ever see rows this user is a participant of. Returns an unsubscribe function.
 */
export function subscribeToChat(userId: string, handlers: ChatRealtimeHandlers): () => void {
  const channel = supabase
    .channel(`chat:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: { new: IncomingMessage }) => handlers.onMessage(payload.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' },
      () => handlers.onConversation())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload: { new: IncomingNotification }) => handlers.onNotification?.(payload.new))
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
