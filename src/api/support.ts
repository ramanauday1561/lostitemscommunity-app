import { supabase } from '../lib/supabase';

export interface FaqEntry {
  id: string;
  keyword: string;
  question: string;
  answer: string;
  category?: string;
  created_at?: string;
}

export interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  type: 'user' | 'bot' | 'agent';
  is_read: boolean;
  escalated: boolean;
  created_at: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

/** Load all FAQ entries for keyword matching */
export async function getFaqEntries(): Promise<FaqEntry[]> {
  const { data, error } = await supabase
    .from('faq_entries')
    .select('*')
    .order('keyword', { ascending: true });

  if (error) {
    console.error('Failed to load FAQ entries:', error);
    return [];
  }
  return data || [];
}

/** Find FAQ entry by keyword matching */
export async function findMatchingFaq(keyword: string): Promise<FaqEntry | null> {
  if (!keyword.trim()) return null;

  const { data, error } = await supabase
    .from('faq_entries')
    .select('*')
    .ilike('keyword', `%${keyword}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Load all support messages for a user */
export async function loadSupportMessages(userId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load support messages:', error);
    return [];
  }

  return (data || []).map(msg => ({
    ...msg,
    created_at: formatTime(msg.created_at),
  }));
}

/** Send a new support message */
export async function sendSupportMessage(
  userId: string,
  message: string,
  type: 'user' | 'bot' = 'user'
): Promise<void> {
  if (!message.trim()) return;

  const { error } = await supabase.from('support_messages').insert({
    user_id: userId,
    message: message.trim(),
    type,
    is_read: false,
    escalated: false,
  });

  if (error) throw new Error(error.message);
}

/** Mark support message as read */
export async function markSupportMessageRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('id', messageId);

  if (error) throw new Error(error.message);
}

/** Escalate a support message for human agent review */
export async function escalateSupportMessage(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('support_messages')
    .update({ escalated: true })
    .eq('id', messageId);

  if (error) throw new Error(error.message);
}

/** Send automated FAQ response */
export async function sendFaqResponse(userId: string, faqId: string, answer: string): Promise<void> {
  const { error } = await supabase.from('support_messages').insert({
    user_id: userId,
    message: answer,
    type: 'bot',
    is_read: false,
    escalated: false,
  });

  if (error) throw new Error(error.message);
}
