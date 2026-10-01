/**
 * Where Supabase should send people back to after they click an emailed link.
 *
 * - EXPO_PUBLIC_APP_URL wins (set to the production site in .env.production);
 * - on the web in development, the page's own origin;
 * - on native, the app's deep-link scheme (app.json "scheme").
 *
 * Whatever this returns MUST be in Supabase -> Authentication -> URL Configuration -> Redirect URLs,
 * otherwise Supabase ignores it and falls back to the project's Site URL.
 */
export const NATIVE_SCHEME_URL = 'lostitems://';

export function appUrl(): string {
  const configured = process.env.EXPO_PUBLIC_APP_URL;
  if (configured) return configured;
  const w = (globalThis as { window?: { location?: { origin?: string } } }).window;
  return w?.location?.origin || NATIVE_SCHEME_URL;
}

/** Removes the one-time tokens from the address bar (web) once they've been used. */
export function scrubAuthUrl() {
  const w = (globalThis as { window?: { history?: { replaceState?: (d: unknown, t: string, u: string) => void }; location?: { pathname?: string } } }).window;
  if (w?.history?.replaceState && w.location?.pathname) w.history.replaceState(null, '', w.location.pathname);
}
