import { supabase } from '../lib/supabase';
import { formatTime } from '../lib/time';
import type { Database } from '../lib/database.types';

export interface Convo {
  id: string;
  itemId: string;
  item: string;
  icon: string;
  with: string;
  time: string;
  unread: number;
  msgs: ChatMsg[];
}

export interface ChatMsg {
  text: string;
  time: string;
  from: 'me' | 'them';
}

type ConversationRow = Database['public']['Tables']['conversations']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

/** Load all conversations the user is part of (as reporter or claimant).
 *  Returns the conversation with the other party's name and the item title. */
export async function loadConversations(userId: string): Promise<Convo[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      item_id,
      reporter_id,
      claimant_id,
      created_at,
      items!inner(title, icon, display_id),
      messages(id, read_at, sender_id, created_at),
      reporter:profiles!reporter_id(handle),
      claimant:profiles!claimant_id(handle)
    `)
    .or(`reporter_id.eq.${userId},claimant_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as any[]).map((c) => {
    const isReporter = c.reporter_id === userId;
    const item = Array.isArray(c.items) ? c.items[0] : c.items;
    const otherProfile = isReporter ? c.claimant : c.reporter;
    const otherHandle = otherProfile?.handle || 'Unknown';
    // Derive unread: messages in this conversation where read_at is null and sender is not me.
    const unreads = (c.messages || []).filter((m: any) => !m.read_at && m.sender_id !== userId);
    // Last message time, or conversation created_at.
    const lastMsg = (c.messages || []).sort((a: any, b: any) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    const time = formatTime(lastMsg?.created_at || c.created_at);

    return {
      id: c.id,
      itemId: c.item_id,
      item: item?.title || '(item deleted)',
      icon: item?.icon || 'inventory_2',
      with: otherHandle,
      time,
      unread: unreads.length,
      msgs: [],
    };
  });
}

/** Load all messages in a conversation, ordered by created_at.
 *  Each message includes sender info to determine if it's "me" or "them". */
export async function loadMessages(conversationId: string, userId: string): Promise<ChatMsg[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      body,
      created_at,
      read_at
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as MessageRow[]).map((m) => ({
    text: m.body,
    time: formatTime(m.created_at),
    from: m.sender_id === userId ? 'me' : 'them',
  }));
}

/** Send a message in a conversation. */
export async function sendMessage(conversationId: string, userId: string, body: string): Promise<void> {
  if (!body.trim()) return;
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
}

/** Mark all unread messages in a conversation as read by the current user. */
export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  // Update messages where read_at is null and sender_id is not the user.
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .is('read_at', null)
    .neq('sender_id', userId);
  if (error) throw new Error(error.message);
}
