import { supabase } from '../lib/supabase';
import { appUrl } from '../lib/appUrl';
import { LINK_EXPIRED } from '../lib/authUrl';
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
  if (m.includes('email address') && m.includes('invalid')) return 'That email address doesn\'t look valid. Check it and try again.';
  if (m.includes('weak') || m.includes('pwned') || m.includes('compromised') || m.includes('easy to guess')) return 'That password is too easy to guess. Choose a different one.';
  if (m.includes('different from the old password')) return 'Choose a password you haven\'t used before.';
  if (m.includes('session') && (m.includes('missing') || m.includes('expired') || m.includes('not found'))) return LINK_EXPIRED;
  if (m.includes('rate limit')) return 'Too many attempts. Wait a moment and try again.';
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('fetch failed')) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return 'Something went wrong. Please try again.';
}

const RATE_LIMITED = 'Too many attempts. Wait a few minutes and try again.';
const NETWORK_ERROR = "Can't reach the server. Check your connection and try again.";

/**
 * Sign in with an email, or with a username.
 *
 * An email goes straight to Supabase Auth. A username is resolved on the SERVER by the `login`
 * Edge Function (backend/functions/login), which throttles attempts and returns only a session
 * or one generic error. The client never learns anyone's email, and unknown usernames and wrong
 * passwords are indistinguishable.
 */
export async function signIn(identifier: string, password: string) {
  const id = identifier.trim();

  if (id.includes('@')) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: id, password });
    if (error) throw new AuthApiError(mapAuthError(error.message));
    return data;
  }

  const { data, error } = await supabase.functions.invoke('login', { body: { identifier: id, password } });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 429) throw new AuthApiError(RATE_LIMITED);
    if (status === 403) throw new AuthApiError('Confirm your email address before signing in.');
    if (status === 400 || status === 401) throw new AuthApiError(GENERIC_LOGIN_ERROR);
    throw new AuthApiError(NETWORK_ERROR);
  }
  const session = (data as { session?: { access_token: string; refresh_token: string } } | null)?.session;
  if (!session) throw new AuthApiError(GENERIC_LOGIN_ERROR);

  const { data: set, error: setError } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (setError) throw new AuthApiError(mapAuthError(setError.message));
  return set;
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
      // Without this the confirmation link lands on the Supabase project's Site URL (localhost in dev setups).
      emailRedirectTo: appUrl(),
    },
  });
  if (error) throw new AuthApiError(mapAuthError(error.message));
  return { signedIn: !!data.session };
}

export async function requestPasswordReset(email: string) {
  // Always resolves the same way whether or not the email exists, so the UI
  // can show one "check your email" state without leaking which emails are
  // registered.
  await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() });
}

/** Adopts the short-lived session from a password-reset link so `updatePassword` is allowed. */
export async function startRecovery(accessToken: string, refreshToken: string) {
  const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (error) throw new AuthApiError(LINK_EXPIRED);
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

/** The signed-in user's email. It lives on auth.users, not profiles, so it comes from the auth session. */
export async function getMyEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

/** Stamps guidelines_accepted_at on the caller's own profile (allowed by profiles_update_self). */
export async function acceptGuidelines(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ guidelines_accepted_at: new Date().toISOString() })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw new AuthApiError("Couldn't save that. Please try again.");
  return data;
}
