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

// ---------------------------------------------------------------------------------------------
// "Talk to a human" (11.3): the member opens a request, a superadmin replies and closes it.
// ---------------------------------------------------------------------------------------------

/** Confirmation the bot posts into the member's thread when they hand over to a person. */
export const HANDOFF_NOTICE = "I've passed this to our support team. A person will reply right here, and you'll get a notification when they do.";

/**
 * Opens a support request for the member. A member has at most one open request, so asking again while
 * one is open is not an error: returns 'already_open' and the caller says so instead of duplicating.
 */
export async function openSupportRequest(userId: string): Promise<'opened' | 'already_open'> {
  const { error } = await supabase.from('support_requests').insert({ user_id: userId });
  if (!error) return 'opened';
  if ((error as { code?: string }).code === '23505') return 'already_open';
  throw new Error(error.message);
}

export interface SupportInboxItem {
  requestId: string;
  userId: string;
  handle: string;
  displayName: string;
  openedAt: string;
  messages: SupportMessage[];
}

/** Superadmin: every open request (oldest first) with the member's whole support thread. */
export async function loadSupportInbox(): Promise<SupportInboxItem[]> {
  const { data: reqs, error } = await supabase
    .from('support_requests')
    .select('id, user_id, created_at, profiles!support_requests_user_id_fkey(handle, display_name)')
    .eq('status', 'open')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  const rows = (reqs ?? []) as unknown as {
    id: string; user_id: string; created_at: string; profiles: { handle: string; display_name: string } | null;
  }[];
  if (!rows.length) return [];

  const { data: msgs, error: mErr } = await supabase
    .from('support_messages')
    .select('*')
    .in('user_id', rows.map((r) => r.user_id))
    .order('created_at', { ascending: true });
  if (mErr) throw new Error(mErr.message);
  const all = (msgs ?? []) as SupportMessage[];

  return rows.map((r) => ({
    requestId: r.id,
    userId: r.user_id,
    handle: r.profiles?.handle ?? 'member',
    displayName: r.profiles?.display_name ?? 'Member',
    openedAt: r.created_at,
    messages: all.filter((m) => m.user_id === r.user_id),
  }));
}

/** Superadmin: reply to a member in their support thread (they are notified by a database trigger). */
export async function replyToSupport(userId: string, body: string): Promise<void> {
  const text = body.trim();
  if (!text) return;
  const { error } = await supabase.from('support_messages').insert({ user_id: userId, body: text, sender: 'agent' });
  if (error) throw new Error(error.message);
}

/** Superadmin: mark a request resolved (the member can open a new one later). */
export async function closeSupportRequest(requestId: string, adminId: string): Promise<void> {
  const { error } = await supabase
    .from('support_requests')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: adminId })
    .eq('id', requestId);
  if (error) throw new Error(error.message);
}
