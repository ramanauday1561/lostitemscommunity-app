# Production hardening (checklist item 14.3)

Everything here is a **dashboard setting on the live project** (`tqkmpirusmdckccqfxyd`), so it can't be shipped as code. Tick them off as you go. Last advisor run (2026-10-01) is summarised at the bottom.

## 1. Auth settings — Dashboard → Authentication

- [ ] **Leaked-password protection** — Authentication → Sign In / Providers → Email → *Prevent use of leaked passwords* → on. (The security advisor flags this as the one real WARN. Needs the Pro plan; if your plan doesn't offer it, the app's ≥ 8 character rule is the only check.)
- [ ] **Minimum password length** — same page; set to 8 or more so the server matches the app's rule (the app already enforces ≥ 8 on signup and reset).
- [ ] **Confirm email** — same page → *Confirm email* on, so people can't sign up with an address they don't own. The app already shows "check your inbox" after signup.
- [ ] **Redirect URLs** — Authentication → URL Configuration:
  - Site URL: `https://app.lostitemscommunity.com`
  - Redirect URLs: `https://app.lostitemscommunity.com` and `lostitems://` (password-reset and confirmation links; without these Supabase ignores `redirectTo`).
- [ ] **Email sender** — the built-in Supabase mailer is rate-limited (a handful per hour) and meant for testing. Before launch set up custom SMTP (Authentication → Emails → SMTP Settings), or reset/confirmation emails will silently stop after a few.
- [ ] **Rate limits** — Authentication → Rate Limits: leave the defaults unless you see abuse; the app adds its own per-user limits (migration `0025`) and a login throttle (`login` Edge Function).

## 2. Backups — Dashboard → Database → Backups

- [ ] Confirm daily backups are listed (Pro and above; free-tier projects have none).
- [ ] Turn on **Point in Time Recovery** if you want to restore to a given minute (paid add-on). Daily backups alone mean up to 24 h of loss.
- [ ] Do one **restore drill** into a new project before launch so you know the steps work. (The migrations in `backend/supabase/migrations` + `seed.sql` rebuild the schema but not user data.)

## 3. Project settings

- [ ] **Compute / disk** — Settings → Compute: the smallest instance is fine for launch; check the usage graphs after the first week.
- [ ] **Network restrictions / SSL** — Settings → Database: *Enforce SSL* on. Leave the database port closed to the public unless you need it (the app only uses the API).
- [ ] **API keys** — only the **publishable/anon** key is in the app (it is public by design, `.env.production`). The **service-role key must never be in the repo, the app or CI**; it lives only inside the Edge Function runtime. Rotate it if it has ever been pasted anywhere.
- [ ] **Team access** — Organization → Team: remove anyone who doesn't need dashboard access; turn on MFA for your own account.
- [ ] **Billing alerts / spend cap** — Organization → Billing, so a traffic spike doesn't surprise you.

## 4. Before launch — one-time checks (re-runnable)

- [ ] Security advisor: Dashboard → Advisors → Security (or `get_advisors`) — see "expected findings" below.
- [ ] Performance advisor: reviewed; the remaining findings are INFO/WARN at this scale (see 14.7 in the integration checklist).
- [ ] `backend/supabase/tests/rls_attacks.sql` and `rate_limits.sql` run clean (they roll back; run them in the SQL editor as described in their headers).
- [ ] `npm test`, `npm run oracle` and the *Checks* workflow green on `main`.

## Expected advisor findings (not bugs)

| Finding | Why it stays |
|---|---|
| `auth_leaked_password_protection` (WARN) | Dashboard setting, section 1 above. **This one you should fix.** |
| `is_superadmin` executable by `anon` / `authenticated` | RLS policies call it, so it must stay executable; it only returns whether the *caller* is a superadmin. |
| `username_available` executable by `anon` / `authenticated` | Needed for the signup form's availability check; it returns only true/false (a username-existence oracle, accepted for a public community app). |
| `resolve_moderation_flag` executable by `authenticated` | It checks `is_superadmin()` internally and raises otherwise (tested in `rls_attacks.sql`). |
| `auth_throttle` — RLS enabled, no policy (INFO) | Intentional: nobody but the service role (the `login` function) and the definer trigger function may touch it. |
