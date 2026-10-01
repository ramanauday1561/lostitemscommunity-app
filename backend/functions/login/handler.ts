/**
 * Login logic for the `login` Edge Function, kept free of Deno/Supabase imports so it can be unit
 * tested in Node (tests/functions/login.test.ts). index.ts wires the real dependencies in.
 *
 * Contract: POST { identifier, password } -> 200 { session, user } | 400 | 401 | 403 | 429.
 * The response never says whether a username exists: unknown user and wrong password are the same
 * 401, and unknown usernames still run a (doomed) sign-in so the timing doesn't give them away.
 */

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
}

export interface LoginDeps {
  /** Counts one attempt; true while still within the limit. */
  throttle(key: string, limit: number, windowSeconds: number): Promise<boolean>;
  /** Service-role lookup: username -> email, or null. */
  emailForUsername(username: string): Promise<string | null>;
  /** Password sign-in; never throws. `code` is Supabase Auth's error text when it failed. */
  signIn(email: string, password: string): Promise<{ session: Session | null; user: { id: string; email?: string } | null; code: string | null }>;
}

export interface LoginResult {
  status: number;
  body: Record<string, unknown>;
}

export const LIMITS = {
  perIp: { limit: 30, windowSeconds: 600 },
  perIdentifier: { limit: 8, windowSeconds: 600 },
} as const;

/** Looks like a sign-in that doesn't exist; used so unknown usernames cost the same as known ones. */
export const DECOY_EMAIL = 'no-such-user@login.invalid';

export async function handleLogin(raw: unknown, ip: string, deps: LoginDeps): Promise<LoginResult> {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || identifier.length > 254 || !password || password.length > 1024) {
    return { status: 400, body: { error: 'bad_request' } };
  }

  // Count BOTH keys on every attempt (no short-circuit), so one can't be used to probe the other.
  const [ipOk, idOk] = await Promise.all([
    deps.throttle(`ip:${ip || 'unknown'}`, LIMITS.perIp.limit, LIMITS.perIp.windowSeconds),
    deps.throttle(`id:${identifier.toLowerCase()}`, LIMITS.perIdentifier.limit, LIMITS.perIdentifier.windowSeconds),
  ]);
  if (!ipOk || !idOk) {
    return { status: 429, body: { error: 'rate_limited', retry_after: LIMITS.perIdentifier.windowSeconds } };
  }

  const email = identifier.includes('@') ? identifier : await deps.emailForUsername(identifier);
  const { session, user, code } = await deps.signIn(email ?? DECOY_EMAIL, password);

  if (session && user) {
    return { status: 200, body: { session, user: { id: user.id, email: user.email } } };
  }
  if (code && /email not confirmed/i.test(code) && email) {
    return { status: 403, body: { error: 'email_not_confirmed' } }; // only reachable with a correct password
  }
  return { status: 401, body: { error: 'invalid_credentials' } };
}
