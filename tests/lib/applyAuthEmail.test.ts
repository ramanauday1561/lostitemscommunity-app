/// <reference types="node" />
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAuthPatch, describePatch, checkLiveConfig, SENDER_NAME, SUBJECT } from '../../scripts/apply-auth-email.mjs';

const TEMPLATE = readFileSync(join(__dirname, '../../backend/supabase/templates/confirm-signup.html'), 'utf8');
const SMTP = { SMTP_HOST: 'smtp.resend.com', SMTP_PORT: '465', SMTP_USER: 'resend', SMTP_PASS: 're_secret' };

describe('signup email template', () => {
  test('uses only the confirmation link, with no user-provided text (Supabase deliverability advice)', () => {
    const vars = new Set(TEMPLATE.match(/\{\{[^}]*\}\}/g));
    assert.deepEqual([...vars], ['{{ .ConfirmationURL }}']);
  });

  test('shows the Lost Items Community logo from the public site, with alt text', () => {
    assert.match(TEMPLATE, /<img src="https:\/\/lostitemscommunity\.com\/public\/icons\/icon-192\.png"[^>]*alt="Lost Items Community"/);
    assert.ok(!/supabase/i.test(TEMPLATE.replace(/<!--[\s\S]*?-->/g, '')), 'no Supabase branding in the visible email');
  });
});

describe('buildAuthPatch', () => {
  test('template only: sets the subject and HTML and leaves SMTP alone', () => {
    const p = buildAuthPatch({}, TEMPLATE);
    assert.equal(p.mailer_subjects_confirmation, SUBJECT);
    assert.equal(p.mailer_templates_confirmation_content, TEMPLATE);
    assert.ok(!('smtp_host' in p));
  });

  test('with SMTP: sends as "Lost Items Community" from noreply@lostitemscommunity.com by default', () => {
    const p = buildAuthPatch(SMTP, TEMPLATE);
    assert.equal(p.smtp_sender_name, SENDER_NAME);
    assert.equal(SENDER_NAME, 'Lost Items Community');
    assert.equal(p.smtp_admin_email, 'noreply@lostitemscommunity.com');
    assert.equal(p.smtp_port, 465);
    assert.equal(p.external_email_enabled, true);
    assert.equal(p.mailer_autoconfirm, false, 'never turns email confirmation off');
    assert.equal(buildAuthPatch({ ...SMTP, SMTP_FROM: 'hello@lostitemscommunity.com' }, TEMPLATE).smtp_admin_email, 'hello@lostitemscommunity.com');
  });

  test('a half-filled SMTP config is refused instead of half-applied', () => {
    assert.throws(() => buildAuthPatch({ SMTP_HOST: 'smtp.resend.com' }, TEMPLATE), /missing: SMTP_PORT, SMTP_USER, SMTP_PASS/);
    assert.throws(() => buildAuthPatch({ ...SMTP, SMTP_PORT: 'abc' }, TEMPLATE), /SMTP_PORT must be a number/);
  });

  test('refuses a template without the confirmation link', () => {
    assert.throws(() => buildAuthPatch({}, '<p>hi</p>'), /ConfirmationURL/);
  });

  test('the printed summary never shows the SMTP password', () => {
    const shown = JSON.stringify(describePatch(buildAuthPatch(SMTP, TEMPLATE)));
    assert.ok(!shown.includes('re_secret'));
  });
});

describe('checkLiveConfig', () => {
  const good = { site_url: 'https://app.lostitemscommunity.com', uri_allow_list: 'lostitems://', smtp_host: 'smtp.resend.com', mailer_autoconfirm: false };

  test('the intended setup has no warnings', () => assert.deepEqual(checkLiveConfig(good), []));

  test('warns when the Site URL is elsewhere and the allow-list would drop the ?auth=signup marker', () => {
    const w = checkLiveConfig({ ...good, site_url: 'http://localhost:3000', uri_allow_list: 'https://app.lostitemscommunity.com' });
    assert.equal(w.length, 1);
    assert.match(w[0], /Site URL/);
    assert.deepEqual(checkLiveConfig({ ...good, site_url: 'http://localhost:3000', uri_allow_list: 'https://app.lostitemscommunity.com/**' }), []);
  });

  test('warns about the built-in mailer and about confirmation being off', () => {
    assert.match(checkLiveConfig({ ...good, smtp_host: null }).join(' '), /Supabase Auth/);
    assert.match(checkLiveConfig({ ...good, mailer_autoconfirm: true }).join(' '), /turned off/);
  });
});
