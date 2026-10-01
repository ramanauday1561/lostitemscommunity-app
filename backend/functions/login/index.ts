// Edge Function `login` (Deno). Deploy with:  supabase functions deploy login
// (verify_jwt stays ON: the app calls it with the public anon key, which is a valid JWT, so
// random internet traffic that doesn't even have the anon key is rejected before reaching us.)
// All logic lives in ./handler.ts so it can be unit tested in Node.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleLogin, type LoginDeps } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, opts);

const cors = {
  'Access-Control-Allow-Origin': '*', // no cookies are involved; the response is a token for the caller who supplied the password
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const deps: LoginDeps = {
  async throttle(key, limit, windowSeconds) {
    const { data, error } = await admin.rpc('auth_throttle_hit', { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) return true; // fail open on a throttle-table outage rather than locking everyone out; Auth has its own limits
    return data === true;
  },
  async emailForUsername(username) {
    const { data, error } = await admin.rpc('email_for_username', { p_username: username });
    return error ? null : (data as string | null);
  },
  async signIn(email, password) {
    // A fresh anon client per attempt: nothing is persisted or shared between requests.
    const client = createClient(url, anonKey, opts);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) return { session: null, user: null, code: error?.message ?? 'no session' };
    const { access_token, refresh_token, expires_in, expires_at, token_type } = data.session;
    return { session: { access_token, refresh_token, expires_in, expires_at, token_type }, user: { id: data.user.id, email: data.user.email }, code: null };
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: cors });

  let body: unknown = null;
  try { body = await req.json(); } catch { /* handled as bad_request below */ }

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const { status, body: out } = await handleLogin(body, ip, deps);
  return Response.json(out, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
});
