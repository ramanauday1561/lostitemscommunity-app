import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export class AuthApiError extends Error {}

export type Profile = Database['public']['Tables']['profiles']['Row'];

const GENERIC_LOGIN_ERROR = 'Invalid username/email or password.';

/** Never let a raw Supabase/Postgres error string reach the UI unmapped. */
function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return GENERIC_LOGIN_ERROR;
  if (m.includes('email not confirmed')) return 'Confirm your email address before signing in.';
  if (m.includes('user already registered')) return 'That email is already registered. Try signing in instead.';
  if (m.includes('password should be at least')) return 'Use at least 8 characters for your password.';
  if (m.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.';
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('fetch failed')) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return 'Something went wrong. Please try again.';
}

/** Resolves a login identifier (username or email) to the email Supabase Auth signs in with. */
async function resolveEmail(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) return trimmed;
  const { data, error } = await supabase.rpc('email_for_username', { p_username: trimmed });
  if (error) return null;
  return data;
}

export async function signIn(identifier: string, password: string) {
  const email = await resolveEmail(identifier);
  if (!email) throw new AuthApiError(GENERIC_LOGIN_ERROR);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AuthApiError(mapAuthError(error.message));
  return data;
}

export interface SignUpResult {
  /** false when email confirmation is required and no session was issued yet. */
  signedIn: boolean;
}

export async function signUp(username: string, email: string, password: string): Promise<SignUpResult> {
  const trimmedUsername = username.trim();

  const { data: available, error: checkError } = await supabase.rpc('username_available', {
    p_username: trimmedUsername,
  });
  if (!checkError && available === false) {
    throw new AuthApiError('That username is already taken. Try another.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { username: trimmedUsername, handle: trimmedUsername, display_name: trimmedUsername },
    },
  });
  if (error) throw new AuthApiError(mapAuthError(error.message));
  return { signedIn: !!data.session };
}

export async function requestPasswordReset(email: string) {
  // Always resolves the same way whether or not the email exists, so the UI
  // can show one "check your email" state without leaking which emails are
  // registered.
  await supabase.auth.resetPasswordForEmail(email.trim());
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new AuthApiError(mapAuthError(error.message));
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
  if (error) return null;
  return data;
}
