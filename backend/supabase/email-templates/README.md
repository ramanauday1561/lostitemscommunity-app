# Auth email templates

Branded HTML for the emails Supabase Auth sends. Supabase keeps these in the project's Auth settings, not in
the repo, so they have to be pasted in once (and again if you edit them here).

Paste each file into **Supabase -> Authentication -> Emails -> Templates** (the page may be called "Email Templates"),
and set the subject shown below.

| Template in Supabase | File | Subject |
|---|---|---|
| Confirm sign up | `confirm-signup.html` | Confirm your Lost Items Community account |
| Reset password | `reset-password.html` | Reset your Lost Items Community password |
| Magic link | `magic-link.html` | Your Lost Items Community sign-in link |
| Change email address | `change-email.html` | Confirm your new email address |
| Invite user | `invite.html` | You're invited to Lost Items Community |
| Reauthentication | `reauthentication.html` | Your Lost Items Community confirmation code |

Notes
- The `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}` and `{{ .Token }}` placeholders are Supabase's; leave them as is.
- The logo is `https://app.lostitemscommunity.com/icon-192.png` (served from `public/`).
- Layout is table-based with inline styles so it renders in Gmail, Apple Mail and Outlook. A `prefers-color-scheme: dark`
  block gives a dark version in clients that support it.
- Also set **Authentication -> SMTP Settings -> Sender name** to `Lost Items Community` so the inbox shows that instead of "Supabase Auth".
  Supabase's built-in sender is rate limited and meant for testing; for production use your own SMTP provider.
