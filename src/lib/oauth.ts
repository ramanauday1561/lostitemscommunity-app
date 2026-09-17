import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

/** Providers offered on the auth screens. Supabase calls X "twitter". */
export type OAuthProvider = 'google' | 'facebook' | 'twitter';

export const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  facebook: 'Facebook',
  twitter: 'X',
};

/**
 * Supabase answers with this when the provider exists but has no client id
 * and secret configured in the dashboard. Worth detecting so the user gets
 * a sentence they can act on instead of a raw API string.
 */
function isProviderNotEnabled(message: string) {
  const m = message.toLowerCase();
  return m.includes('not enabled') || m.includes('unsupported provider') || m.includes('provider is not');
}

export class ProviderNotConfiguredError extends Error {
  constructor(public provider: OAuthProvider) {
    super(
      `${PROVIDER_LABEL[provider]} sign-in is not set up yet. Enable the provider in Supabase ` +
        `(Authentication → Sign In / Providers) and add its client ID and secret.`,
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

/**
 * The web build is served from a sub-path (/lostitemscommunity-management/
 * app-preview/), and window.location.origin drops it — the OAuth redirect
 * would land on the domain root rather than the app. Expo exposes the
 * configured base path as EXPO_BASE_URL, so the two are combined.
 */
function webRedirectUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const base = process.env.EXPO_BASE_URL ?? '/';
  return new URL(base, window.location.origin).toString();
}

/**
 * supabase-js builds the /authorize URL locally and never calls the server,
 * so signInWithOAuth returns error: null even for a provider that is not
 * configured. The failure only appears once the browser loads that URL,
 * which renders Supabase's raw JSON error as a page and strands the user
 * outside the app.
 *
 * Asking for the URL first tells us which it will be: a configured provider
 * answers with a redirect to the provider, an unconfigured one with a 400
 * and a JSON body. A redirect read with redirect:'manual' comes back opaque
 * (type 'opaqueredirect', status 0), which is itself the signal that the
 * provider is live.
 *
 * The probe is best-effort: if it cannot run, sign-in proceeds as before.
 */
async function preflight(url: string, provider: OAuthProvider): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET', redirect: 'manual' });
  } catch {
    return; // network or CORS issue — do not block the real attempt
  }

  // Opaque redirect: the provider is configured and we are being sent to it.
  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) return;

  if (res.status >= 400) {
    let message = '';
    try {
      const body = (await res.json()) as { msg?: string; error_description?: string; message?: string };
      message = body.msg ?? body.error_description ?? body.message ?? '';
    } catch {
      // fall through to the generic error below
    }
    if (!message || isProviderNotEnabled(message)) throw new ProviderNotConfiguredError(provider);
    throw new Error(message);
  }
}

/**
 * Native and web need different halves of the OAuth dance:
 *
 * - Web: Supabase redirects the page itself, the session lands via the URL
 *   and supabase-js picks it up. Nothing more to do here.
 * - Native: we ask Supabase for the authorisation URL, open it in the
 *   system browser, then exchange the returned code for a session. The
 *   redirect comes back to the app's own scheme (lostitems://).
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const redirectTo =
    Platform.OS === 'web' ? webRedirectUrl() : AuthSession.makeRedirectUri({ scheme: 'lostitems', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      // Always take the URL rather than letting supabase-js navigate, so a
      // misconfigured provider can be reported inside the app instead of
      // replacing it with a JSON error page.
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    if (isProviderNotEnabled(error.message)) throw new ProviderNotConfiguredError(provider);
    throw error;
  }
  if (!data?.url) throw new Error('Supabase did not return an authorisation URL.');

  await preflight(data.url, provider);

  if (Platform.OS === 'web') {
    window.location.href = data.url;
    return;
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return; // user dismissed it

  // PKCE: the redirect carries ?code=..., which is traded for a session.
  const params = new URL(result.url).searchParams;
  const code = params.get('code');
  const errorDescription = params.get('error_description');

  if (errorDescription) throw new Error(errorDescription);
  if (!code) throw new Error('No authorisation code was returned.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

/**
 * GoTrue signs in by email, never by username, so a username has to be
 * translated first. resolve_login_identifier returns an email untouched
 * and looks a username up, so this is safe to call with either.
 */
export async function resolveIdentifierToEmail(identifier: string): Promise<string | null> {
  const value = identifier.trim();
  if (!value) return null;

  const { data, error } = await supabase.rpc('resolve_login_identifier', { p_identifier: value });
  if (error) {
    // If the lookup itself fails, fall back to treating the input as an
    // email rather than blocking sign-in entirely.
    console.warn('[auth] username lookup failed:', error.message);
    return value.includes('@') ? value : null;
  }
  return (data as string | null) ?? null;
}
