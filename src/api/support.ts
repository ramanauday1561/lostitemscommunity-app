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

/** Shown when no FAQ entry matches. */
export const FAQ_FALLBACK =
  'I\'m not sure about that one yet. Tap "Talk to a human instead" and our support team will pick it up — they usually reply within minutes.';

/**
 * Picks the bot's answer for what the user typed: an exact question match first (a tapped chip),
 * otherwise the first entry (in `position` order) with a keyword contained in the text.
 * Same rule as the prototype's `askBot`.
 */
export function matchFaq(entries: FaqEntry[], text: string): FaqEntry | null {
  const low = text.trim().toLowerCase();
  if (!low) return null;
  return entries.find((e) => e.question.toLowerCase() === low)
    ?? entries.find((e) => e.keywords?.some((k) => low.includes(k.toLowerCase())))
    ?? null;
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
