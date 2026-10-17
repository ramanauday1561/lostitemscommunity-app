/**
 * Parsing for the links Supabase Auth sends back to the app (password reset, signup confirmation).
 *
 * Supabase redirects to `redirectTo` with the result in the URL FRAGMENT (implicit flow):
 *   success: #access_token=…&refresh_token=…&type=recovery   (or type=signup for a confirmation link)
 *   failure: #error=access_denied&error_code=otp_expired&error_description=…
 * (the same keys can also arrive in the query string, so both are read). A failure carries no `type`,
 * so signup links are sent with `?auth=signup` on the redirect URL (see signupRedirectUrl in appUrl.ts) to tell the
 * two apart. No imports, so it runs under plain Node in the unit tests.
 */

export type AuthFlow = 'recovery' | 'signup';

export type AuthUrl =
  | { kind: 'recovery'; accessToken: string; refreshToken: string }
  | { kind: 'signup'; accessToken: string; refreshToken: string }
  | { kind: 'error'; flow: AuthFlow; code: string; message: string }
  | null;

export const LINK_EXPIRED = 'That reset link has expired or was already used. Request a new one.';
export const LINK_INVALID = "That link isn't valid. Request a new reset link.";
export const SIGNUP_LINK_EXPIRED =
  'That confirmation link has expired or was already used. If you already confirmed your email, just sign in. '
  + 'Otherwise, sign up again with the same email and we will send you a new link.';
export const SIGNUP_LINK_INVALID = "That confirmation link isn't valid. Try signing in, or sign up again to get a new link.";

function params(url: string): URLSearchParams {
  const hashAt = url.indexOf('#');
  const queryAt = url.indexOf('?');
  const out = new URLSearchParams();
  const take = (s: string) => new URLSearchParams(s).forEach((v, k) => { if (!out.has(k)) out.set(k, v); });
  if (hashAt >= 0) take(url.slice(hashAt + 1));
  if (queryAt >= 0) take(url.slice(queryAt + 1, hashAt >= 0 && hashAt > queryAt ? hashAt : undefined));
  return out;
}

export function parseAuthUrl(url: string | null | undefined): AuthUrl {
  if (!url) return null;
  const p = params(url);
  const type = p.get('type');
  const flow: AuthFlow = p.get('auth') === 'signup' || type === 'signup' ? 'signup' : 'recovery';

  const error = p.get('error_code') || p.get('error');
  if (error) {
    const expired = /otp_expired|expired|access_denied/i.test(`${p.get('error_code') ?? ''} ${p.get('error') ?? ''}`);
    const message = flow === 'signup'
      ? (expired ? SIGNUP_LINK_EXPIRED : SIGNUP_LINK_INVALID)
      : (expired ? LINK_EXPIRED : LINK_INVALID);
    return { kind: 'error', flow, code: error, message };
  }

  const access = p.get('access_token');
  const refresh = p.get('refresh_token');
  if (!access || !refresh) return null;
  if (type === 'recovery') return { kind: 'recovery', accessToken: access, refreshToken: refresh };
  if (type === 'signup') return { kind: 'signup', accessToken: access, refreshToken: refresh };
  return null;
}
