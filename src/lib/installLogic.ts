/** Pure rules for the "install this app" banner (the browser APIs live in InstallBanner.web.tsx). */

/** iPhone/iPad Safari and the other iOS browsers can't be prompted: people add the app from the Share menu. */
export function isIos(ua: string, platform: string, touchPoints: number): boolean {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return platform === 'MacIntel' && touchPoints > 1; // iPadOS reports itself as a Mac
}

export const SNOOZE_DAYS = 7;

/** After dismissing the banner it stays away for a week. */
export function isSnoozed(dismissedAt: number | null, now: number): boolean {
  if (!dismissedAt) return false;
  return now - dismissedAt < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
}

export type InstallMode = 'prompt' | 'ios' | null;

/** Which banner (if any) to show. `canPrompt` = the browser handed us a `beforeinstallprompt` event. */
export function installMode(opts: { standalone: boolean; snoozed: boolean; ios: boolean; canPrompt: boolean }): InstallMode {
  if (opts.standalone || opts.snoozed) return null;
  if (opts.canPrompt) return 'prompt';
  return opts.ios ? 'ios' : null;
}
