# Backend

Supabase (Postgres + Auth + Storage) schema for Lost Items Community. This
folder is new — the app currently runs entirely on the mock state in
`src/state/store.ts` / `src/data/constants.ts`; nothing here is wired up to
the frontend yet. It exists so the schema can be designed, reviewed and
migrated independently of the UI work.

```
backend/
  supabase/
    migrations/     -- numbered, applied in order
    seed.sql         -- local dev data, mirrors src/data/constants.ts
```

## Applying it

```bash
npx supabase init          # once, if this project has no supabase/ config yet
npx supabase start         # local Postgres + Auth + Storage in Docker
npx supabase db reset      # runs every migration, then seed.sql
```

Against a hosted project, use `supabase link` then `supabase db push`, or the
Supabase MCP tools (`apply_migration`) already available in this environment.

## Roles

Two roles, matching the product (not three — see "the 'new user' role" below):

| Role | Stored as | Can do |
|---|---|---|
| **user** | `profiles.role = 'user'` | Report lost/found items, edit/withdraw their own, claim + message, post to the forum, flag content, manage their own profile. |
| **superadmin** | `profiles.role = 'superadmin'` | Everything a user can, plus: approve/remove flagged content, suspend/remove any member, suspend/delete any forum thread, manage ad campaigns & placements, read the audit log. |

There is no in-app path to become `superadmin` — it's set directly in the
database by an operator, same as the prototype hardcodes `superadmin` as a
single account.

### The frontend's "new user" role

`src/state/store.ts` has a third `Role` value, `'new'`, used only for the
`newuser` quick-login demo persona (an account with nothing posted yet, so
the dashboard shows onboarding steps instead of stats). It is **not** a
fourth backend role — it's `role = 'user'` with `post_count = 0` and
`guidelines_accepted_at is null`. Compute "is this a fresh account" client-side
from those two columns instead of adding a role.

## Schema overview

| Frontend type (`src/data/constants.ts`) | Table(s) |
|---|---|
| `Member` / `me()` | `profiles` |
| `Item` (`LOST`, `FOUND`) | `items`, `item_photos` |
| `FlaggedRecord` | `moderation_flags` (+ `moderation_keywords` for the keyword-hit list) |
| `Thread` / `Reply` | `forum_threads`, `forum_replies` |
| `Convo` / `ChatMsg` | `conversations`, `messages` |
| `Ad` / `Campaign` | `ad_placements`, `ad_campaigns` |
| `FaqEntry` | `faq_entries` |
| — (not in current mock state) | `notifications`, `support_messages`, `audit_log` |

Full column-level detail is in the migration files themselves — each table
and non-obvious column has a comment explaining *why*, not just what.

### Design choices worth flagging

- **One `items` table, not separate `lost_items`/`found_items`.** The
  frontend already treats them as one list filtered by `kind` (`st.lost` /
  `st.found` both hold `Item[]`); splitting them would just require a UNION
  everywhere the registry search/filter runs.
- **Hard delete vs. soft delete.** The prototype hard-deletes items, forum
  threads *and* members when a superadmin clicks "Delete"/"Remove". We keep
  that for items and threads (their content has no downstream referential
  integrity concern once removed), but **members are soft-deleted** into
  `deleted_profiles` — a member row is the foreign-key target for their
  items, threads, replies and messages, so real deletion would either cascade
  away other people's conversation history or need `ON DELETE SET NULL`
  everywhere, both worse than a tombstone table.
- **`moderation_flags` is polymorphic** (`target_type` + `target_id`) over
  items and forum threads rather than two separate flag tables, since the
  Admin > Moderation queue already renders both kinds through one list with
  identical approve/remove actions (`decide()` in `src/state/selectors.ts`).
- **Ad revenue/impressions/CTR are plain columns, not computed.** In
  production these come from whatever ad network or analytics pipeline is
  wired up later (a scheduled Edge Function updating the row), not from
  client writes — RLS only allows `superadmin` to write `ad_placements` at
  all.
- **`days_left` is a view column, not stored** (`ad_placements_with_status`
  in `0012_views.sql`), computed from `starts_at` + `duration_days`, so it's
  never stale.
- **Analytics views use `security_invoker = true`** so a regular user
  querying `moderation_counts`/`weekly_report_counts` still only sees what
  their own row-level policies allow — the aggregate views don't
  accidentally become a privilege-escalation path.

## Row Level Security

Every table has RLS enabled from `0010_rls_policies.sql`. The shape is
consistent everywhere:

- `public.is_superadmin()` — a `security definer` helper so policies can
  check the caller's role without recursively hitting RLS on `profiles`.
- Public/community content (items not flagged, live forum threads, ad
  placements, FAQ) — readable by anyone signed in.
- Anything you authored (an item you reported, a thread you posted, your own
  profile) — you can read/update it; `superadmin` can always read/update/delete it.
- Conversations & messages are participant-only, with **no** superadmin
  override — Admin > Messages is the superadmin's own inbox, not a global
  read of every DM (matches `roleState()` in `src/state/store.ts`, which
  never grants the admin persona visibility into other users' `convos`).
- Money/config tables (`ad_campaigns`, `ad_placements`, `faq_entries`,
  `moderation_keywords`) — public read, `superadmin`-only write.

## Storage

Two public-read buckets (`0011_storage.sql`):

- `item-photos` — used by the "Add a photo" step in the report sheet
  (`src/sheets/Report.tsx`). Currently a no-op button (`store.flash('Photo
  picker opens here.')`); this bucket is ready for when that's wired up.
- `avatars` — profile pictures.

Both use a `<bucket>/<user_id>/<file>` folder convention so the write policy
is a simple path check.

## What's intentionally not modeled yet

- Push/email delivery for `notifications` (the table just records what
  *should* notify; delivery is a separate integration).
- A real-time "who's online" count (`scouts`/"857 online" and the
  "Conversation & sentiment" panel on the admin dashboard —
  `src/screens/Dashboards.tsx`, `sentimentRows` in
  `src/state/selectors.ts` — are decorative demo data in the prototype, not
  derived from anything trackable server-side without presence infra or a
  real sentiment pipeline). Confirm with product before building schema for
  this; "active threads" is trivially `count(*) from forum_threads`, the rest
  isn't.
- Rate limiting / anti-spam beyond the keyword-hit counter.

## Verification pass

Re-walked every screen and sheet after the first draft (Welcome, Login,
Signup, Forgot, Dashboards, Registry, Forum, Admin, Detail, Chat, Misc,
Report) against the migrations above. One gap found and fixed: the forum
thread "Helpful" button (`src/screens/Forum.tsx`, `helpful` in
`src/state/selectors.ts`) only flashed a toast in the prototype with nothing
to persist it to — added `forum_thread_votes` + `forum_threads.helpful_count`
in `0013_forum_helpful_votes.sql`. Everything else (auth fields, item
fields + photos, claim chat, forum posts/replies, moderation, ads, FAQ,
notifications, support chat, audit log, profile settings, guidelines) maps
directly onto the tables above.
