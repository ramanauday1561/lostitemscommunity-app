import { supabase } from '../lib/supabase';

export interface IncomingMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatRealtimeHandlers {
  /** A message row visible to this user was inserted (including their own, from any device). */
  onMessage: (m: IncomingMessage) => void;
  /** A conversation involving this user was created (someone claimed an item, or I did). */
  onConversation: () => void;
}

/**
 * Subscribes to new messages and conversations. Realtime applies RLS per subscriber, so the
 * callbacks only ever see rows this user is a participant of. Returns an unsubscribe function.
 */
export function subscribeToChat(userId: string, handlers: ChatRealtimeHandlers): () => void {
  const channel = supabase
    .channel(`chat:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: { new: IncomingMessage }) => handlers.onMessage(payload.new))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' },
      () => handlers.onConversation())
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
