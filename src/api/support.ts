import { supabase } from '../lib/supabase';

export interface FaqEntry {
  id: string;
  keywords: string[];
  question: string;
  answer: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupportMessage {
  id: string;
  user_id: string;
  body: string;
  sender: 'user' | 'bot' | 'agent';
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
    .order('position', { ascending: true });

  if (error) {
    console.error('Failed to load FAQ entries:', error);
    return [];
  }
  return data || [];
}

/** Find the first FAQ entry (in `position` order) with a keyword matching the search term. */
export async function findMatchingFaq(keyword: string): Promise<FaqEntry | null> {
  const searchTerm = keyword.trim().toLowerCase();
  if (!searchTerm) return null;

  const entries = await getFaqEntries();
  return entries.find((e) => e.keywords?.some((k) => k.toLowerCase().includes(searchTerm))) ?? null;
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

  return data || [];
}

/** Send a new support message */
export async function sendSupportMessage(
  userId: string,
  message: string,
  sender: 'user' | 'bot' = 'user'
): Promise<void> {
  if (!message.trim()) return;

  const { error } = await supabase.from('support_messages').insert({
    user_id: userId,
    body: message.trim(),
    sender,
  });

  if (error) throw new Error(error.message);
}

/** Send automated FAQ response */
export async function sendFaqResponse(userId: string, faqId: string, answer: string): Promise<void> {
  const { error } = await supabase.from('support_messages').insert({
    user_id: userId,
    body: answer,
    sender: 'bot',
  });

  if (error) throw new Error(error.message);
}
