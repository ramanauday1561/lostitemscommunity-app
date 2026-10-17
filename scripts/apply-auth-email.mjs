#!/usr/bin/env node
/**
 * Applies the branded signup email (and, when configured, your own SMTP sender) to the Supabase project
 * through the Management API, then reads the config back to confirm it took.
 *
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-auth-email.mjs            # apply
 *   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-auth-email.mjs --dry-run  # show what would change
 *
 * Template only:  just the token. The subject and HTML come from backend/supabase/templates/confirm-signup.html.
 * Sender too:     also set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (and optionally SMTP_FROM, default
 *                 noreply@lostitemscommunity.com). The sender name is always "Lost Items Community".
 *                 Without SMTP, Supabase's built-in mailer keeps sending as "Supabase Auth" and only to team members.
 *
 * Get a token at https://supabase.com/dashboard/account/tokens. Never commit it, or the SMTP password.
 * See backend/README.md "Signup email".
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PROJECT_REF_DEFAULT = 'tqkmpirusmdckccqfxyd';
export const SENDER_NAME = 'Lost Items Community';
export const SUBJECT = 'Confirm your email for Lost Items Community';
export const APP_URL = 'https://app.lostitemscommunity.com';
const TEMPLATE_PATH = fileURLToPath(new URL('../backend/supabase/templates/confirm-signup.html', import.meta.url));

/** The PATCH body for /v1/projects/{ref}/config/auth. Throws on a half-filled SMTP config. */
export function buildAuthPatch(env, template) {
  if (!template.includes('{{ .ConfirmationURL }}')) throw new Error('The template must contain {{ .ConfirmationURL }}.');
  /** @type {Record<string, string | number | boolean>} */
  const patch = { mailer_subjects_confirmation: SUBJECT, mailer_templates_confirmation_content: template };

  const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const given = smtpKeys.filter((k) => env[k]);
  if (given.length && given.length < smtpKeys.length) {
    throw new Error(`Set all of ${smtpKeys.join(', ')} (missing: ${smtpKeys.filter((k) => !env[k]).join(', ')}).`);
  }
  if (given.length) {
    const port = Number(env.SMTP_PORT);
    if (!Number.isInteger(port) || port <= 0) throw new Error('SMTP_PORT must be a number, e.g. 465 or 587.');
    Object.assign(patch, {
      external_email_enabled: true,
      mailer_autoconfirm: false,
      smtp_admin_email: env.SMTP_FROM || 'noreply@lostitemscommunity.com',
      smtp_host: env.SMTP_HOST,
      smtp_port: port,
      smtp_user: env.SMTP_USER,
      smtp_pass: env.SMTP_PASS,
      smtp_sender_name: SENDER_NAME,
    });
  }
  return patch;
}

/** A printable copy of the patch: secrets and the long HTML are never echoed. */
export function describePatch(patch) {
  const out = { ...patch };
  if (out.smtp_pass) out.smtp_pass = '••••••';
  if (out.mailer_templates_confirmation_content) out.mailer_templates_confirmation_content = `<${out.mailer_templates_confirmation_content.length} chars of HTML>`;
  return out;
}

/** Problems with the live config that would stop the confirmation link reaching the "email confirmed" screen. */
export function checkLiveConfig(cfg) {
  const warnings = [];
  const host = (u) => { try { return new URL(u).hostname; } catch { return ''; } };
  const allow = String(cfg.uri_allow_list || '').split(',').map((s) => s.trim()).filter(Boolean);
  // Supabase accepts any redirect on the Site URL's host; otherwise it must match an allow-list entry.
  if (host(cfg.site_url) !== host(APP_URL) && !allow.some((a) => a.startsWith(APP_URL) && (a.endsWith('**') || a.includes('?')))) {
    warnings.push(`Site URL is ${cfg.site_url || '(unset)'}. Set it to ${APP_URL}, or add ${APP_URL}/** to Redirect URLs, `
      + 'otherwise confirmation links ignore the ?auth=signup marker.');
  }
  if (!cfg.smtp_host) warnings.push('No custom SMTP: emails still come from "Supabase Auth", only to team members, a few per hour.');
  if (cfg.mailer_autoconfirm) warnings.push('"Confirm email" is turned off, so no confirmation email is sent at all.');
  return warnings;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = process.env.PROJECT_REF || PROJECT_REF_DEFAULT;
  const patch = buildAuthPatch(process.env, readFileSync(TEMPLATE_PATH, 'utf8'));

  console.log(`Project ${ref}. ${dryRun ? 'Would apply' : 'Applying'}:`);
  console.log(describePatch(patch));
  if (!patch.smtp_host) console.log('\n(No SMTP_* variables set: only the subject and template change; the sender stays "Supabase Auth".)');
  if (dryRun) return;
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens).');

  const api = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const res = await fetch(api, { method: 'PATCH', headers, body: JSON.stringify(patch) });
  if (!res.ok) throw new Error(`Supabase refused the update (${res.status}): ${(await res.text()).slice(0, 300)}`);

  const live = await (await fetch(api, { headers })).json();
  const mismatched = Object.keys(patch).filter((k) => k !== 'smtp_pass' && String(live[k]) !== String(patch[k]));
  if (mismatched.length) throw new Error(`Saved, but these did not read back as sent: ${mismatched.join(', ')}`);
  console.log('\nSaved and verified.');
  for (const w of checkLiveConfig(live)) console.log(`Warning: ${w}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(`Error: ${e.message}`); process.exit(1); });
}
