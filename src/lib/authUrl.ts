/**
 * Parsing for the links Supabase Auth sends back to the app (password reset).
 *
 * Supabase redirects to `redirectTo` with the result in the URL FRAGMENT (implicit flow):
 *   success: #access_token=…&refresh_token=…&type=recovery
 *   failure: #error=access_denied&error_code=otp_expired&error_description=…
 * (the same keys can also arrive in the query string, so both are read). No imports, so it runs
 * under plain Node in the unit tests.
 */

export type AuthUrl =
  | { kind: 'recovery'; accessToken: string; refreshToken: string }
  | { kind: 'error'; code: string; message: string }
  | null;

export const LINK_EXPIRED = 'That reset link has expired or was already used. Request a new one.';
export const LINK_INVALID = "That link isn't valid. Request a new reset link.";

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

  const error = p.get('error_code') || p.get('error');
  if (error) {
    const expired = /otp_expired|expired|access_denied/i.test(`${p.get('error_code') ?? ''} ${p.get('error') ?? ''}`);
    return { kind: 'error', code: error, message: expired ? LINK_EXPIRED : LINK_INVALID };
  }

  const access = p.get('access_token');
  const refresh = p.get('refresh_token');
  if (p.get('type') === 'recovery' && access && refresh) {
    return { kind: 'recovery', accessToken: access, refreshToken: refresh };
  }
  return null;
}
