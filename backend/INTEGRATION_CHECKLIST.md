# Supabase integration checklist

Work through this top to bottom, one item at a time. Each phase after
Phase 0 maps to one screen/flow so you can ship and test it in isolation
before moving to the next. Every phase ends with a manual test you can run
in the running app before checking it off.

Legend: `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0 — Foundation (blocks every other phase)

- [x] 0.1 Create (or link) a Supabase project. **Decision:** one project for now — `LostItemsCommunity` (`tqkmpirusmdckccqfxyd`, `ap-south-1`), treated as the real/production project (real superadmin account, no mock seed data — see 0.2). Revisit a separate dev/staging project under Phase 14 before this has real end users.
- [x] 0.2 Apply `backend/supabase/migrations/*` — all 15 applied (0001–0015, the last two fixing security-advisor findings from the first pass: `resolve_moderation_flag` had no internal authorization check, several functions had a mutable `search_path`, `citext` was installed into `public`). **Decision:** `backend/supabase/seed.sql` (the LOST/FOUND/forum/ads mock rows) is **not** run against this project since it's being treated as real — it stays for a future local/dev project only. The one row created here for real: the superadmin account (`admin@lostitemscommunity.com`, `role='superadmin'`), inserted directly since there's no in-app path to create it — see the note at the end of this phase.
- [x] 0.3 Installed `@supabase/supabase-js`, `react-native-url-polyfill`, `@react-native-async-storage/async-storage` via plain `npm install` (the environment's network policy blocks `expo install`'s compatibility-check call to `api.expo.dev`, but `registry.npmjs.org` is reachable directly, so plain npm works fine). `expo-image-picker` deferred to Phase 4 — no need to pull in a dependency two phases before anything uses it, and it needs the `expo install` compatibility check, not just a registry fetch.
- [x] 0.4 `.env` created locally with the real `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` (gitignored) + `.env.example` committed with placeholders and the service-role-key warning.
- [x] 0.5 `src/lib/supabase.ts` — single typed client, `AsyncStorage`-backed session persistence, polyfill imported first.
- [x] 0.6 `src/lib/database.types.ts` generated from the live schema via the Supabase MCP tool; `npm run gen:types` added to `package.json` to re-run it later (needs `supabase login` / `SUPABASE_ACCESS_TOKEN` locally, which this session doesn't have — the committed file is current as of migration 0015).
- [x] 0.7 Username→email bridge, **decided**: not a bridge — **Login switches to authenticating by real email**, full stop. `username`/`handle` stay as the public display identity (forum, registry "by", chat), set at signup, but are never used to sign in. Reasoning: a lookup RPC (`username → email`) is an enumeration surface, and an email-convention (`${username}@domain`) only works for accounts we seed ourselves, not real signups. The actual `Login.tsx` copy/field change happens in Phase 1; noting the decision here since it affects how 1.1 is implemented.
- [x] 0.8 `src/api/README.md` — layer scaffolded (one file per domain, filled in phase by phase); no `supabase.from(...)` calls exist in screens yet since no phase has wired a screen up.
- [ ] 0.9 Loading/error/empty UI pattern — not decided yet; first real decision point is Phase 1 (Login's `busy`/`error` state already exists in the mock, so this is really "adapt the existing pattern to async Supabase calls" rather than invent one from scratch). Revisit when starting Phase 1.
- [ ] 0.10 `.github/workflows/checks.yml` not yet updated — no generated-types staleness check or new tests exist to run yet. Revisit once Phase 1 adds the first real `src/api/auth.ts`.

**Verified:** `npx tsc --noEmit` clean, `npm run oracle` still 46/46 (nothing wired up yet, so the mock-data oracle is untouched by this phase).

**Note — superadmin bootstrap account:** since there is no in-app path to create a `superadmin` (by design, see `backend/README.md` "Roles"), one was created directly in this Supabase project: email `admin@lostitemscommunity.com`, `profiles.role = 'superadmin'`. **The generated password was shown once in this conversation and is not recorded anywhere else — retrieve it from the chat history, or reset it via Supabase Auth, before anyone else needs to sign in as superadmin.** Every other account (the `user`/`newuser` personas, real members) is created through Signup in Phase 1, same as any normal user.

**Test:** app still builds and runs unchanged (nothing wired yet — `tsc`/`oracle` above stand in for that on a backend-only phase); confirmed the superadmin row reads back correctly from both `auth.users` and `public.profiles`.

---

## Phase 1 — Auth: Login, Signup, Forgot password

- [ ] 1.1 `src/screens/Login.tsx` → `supabase.auth.signInWithPassword`, replacing `store.signIn`/`store.quick`
- [ ] 1.2 On successful sign-in, fetch the caller's `profiles` row and set `role` from it (not from username string-matching)
- [ ] 1.3 `src/screens/Signup.tsx` → `supabase.auth.signUp` with `data: { username, handle, display_name }` so `handle_new_user()` populates the profile correctly
- [ ] 1.4 `src/screens/Forgot.tsx` → `supabase.auth.resetPasswordForEmail` + `updateUser({ password })` (drops the fake 6-digit code step, or keeps it as UI-only copy since Supabase's own reset flow is link-based — decide and note here)
- [ ] 1.5 `logout()` in `src/state/selectors.ts` → `supabase.auth.signOut`
- [ ] 1.6 Session persistence: restore session on app launch (`supabase.auth.getSession` + `onAuthStateChange`) so a killed/reopened app doesn't drop back to Welcome

**Test:** sign up a new account, confirm a `profiles` row appears with `role = 'user'`, `post_count = 0`; sign out; sign back in with `superadmin`/seed password and confirm the admin dashboard renders; try a wrong password and confirm the existing error copy still shows.

---

## Phase 2 — Dashboard

- [ ] 2.1 Replace `myStats` (hardcoded `'2'/'1'/'4'`) with real counts: active reports (`items` where `reporter_id = me`), reunited count, forum post count (`profiles.post_count`)
- [ ] 2.2 Replace `setupSteps`/`setupProgress` checks (`suTerms`, `myPosts.length`, `threads.some(mine)`) with `profiles.guidelines_accepted_at`, a real items query, a real threads query
- [ ] 2.3 Admin dashboard tiles (`adminMetrics`) → `select * from admin_dashboard_stats`

**Test:** as `newuser`, dashboard shows the onboarding checklist with nothing done; as `user`, stats match what's actually in the DB; as `superadmin`, tiles match `admin_dashboard_stats`.

---

## Phase 3 — Registry (Lost / Found list, search, filters)

- [ ] 3.1 Replace `st.lost`/`st.found` with a query against `items` filtered by `kind`
- [ ] 3.2 Wire `filters` (`All`/`My posts`/`Active`/`Resolved`/`Reunited`/`Flagged`) to real `where` clauses instead of client-side `.filter()`
- [ ] 3.3 Wire the search box (`q`) to `items_search_idx` (`to_tsvector` match) or a simple `ilike`
- [ ] 3.4 Paginate or infinite-scroll instead of loading the whole table (mock data was 4–5 rows; real data won't be)

**Test:** as `user`, "My posts" filter shows only items you reported; as `superadmin`, the `Flagged` filter shows the seeded flagged Samsung Galaxy S24; search for a title substring and confirm it narrows correctly.

---

## Phase 4 — Item detail, report, claim, withdraw

- [ ] 4.1 Detail sheet (`sel`, `detailRows`) → fetch one `items` row (+ `item_photos`) by id
- [ ] 4.2 Report sheet (`reportNext`) → `insert into items`, letting the `set_item_display_id` trigger generate the `LOST-###`/`FOUND-###` id
- [ ] 4.3 "Add a photo" → actually upload to the `item-photos` storage bucket and insert an `item_photos` row (currently a no-op toast)
- [ ] 4.4 Owner actions: `toggleHandover`/`ownerStatuses` → `update items set status = ...` (RLS already restricts to `active/resolved/reunited` for the owner)
- [ ] 4.5 `withdrawPost` → `delete from items`
- [ ] 4.6 `claim()` → `insert into conversations` (unique on `item_id, claimant_id` already prevents duplicates) instead of building a `Convo` object client-side
- [ ] 4.7 `flagRecord` → `insert into moderation_flags (target_type='item', target_id, reason, flagged_by)` instead of just a toast

**Test:** report a new lost item as `user`, confirm it appears in the Lost registry with a generated id; claim a found item as a second test account and confirm exactly one conversation is created even if you tap claim twice; flag an item and confirm it shows up in Admin > Moderation for `superadmin`.

---

## Phase 5 — Chat

- [ ] 5.1 Chat sheet (`convoMsgs`, `messages`) → fetch `messages` for the active `conversation_id`, ordered by `created_at`
- [ ] 5.2 `sendMessage`/`pushMsg` → `insert into messages`
- [ ] 5.3 Realtime: subscribe to `postgres_changes` on `messages` for the open conversation so the other party's replies show up live (replaces the mocked 1600ms auto-reply)
- [ ] 5.4 Unread badge (`unreadTotal`, per-conversation `unread`) → derive from `messages where read_at is null and sender_id <> me`; mark read on opening a conversation
- [ ] 5.5 Admin > Messages (own inbox) reuses the same conversations query, scoped to the superadmin's own `id` — no special-casing needed since RLS is participant-based

**Test:** two accounts, one claims the other's item, both send messages and see them arrive without refreshing; unread count decrements on opening the thread.

---

## Phase 6 — Forum

- [ ] 6.1 Thread list (`visibleThreads`) → query `forum_threads` (RLS already hides `suspended` from non-admins)
- [ ] 6.2 `publishThread` → `insert into forum_threads`
- [ ] 6.3 Thread detail + replies (`thread`, `threadReplies`) → fetch one thread + its `forum_replies`
- [ ] 6.4 `postReply` → `insert into forum_replies`
- [ ] 6.5 `helpful()` → `insert into forum_thread_votes` (unique per user; `helpful_count` updates via trigger) instead of just a toast
- [ ] 6.6 Admin: `suspend`/`remove` on a thread → `update forum_threads set status='suspended'` / `delete from forum_threads`

**Test:** post a thread and a reply as one account, confirm `profiles.post_count` increments for both; tap Helpful twice from the same account and confirm the count only goes up once (primary key blocks the duplicate); suspend a thread as admin and confirm it disappears from the non-admin's list.

---

## Phase 7 — Admin: Moderation

- [ ] 7.1 `flagged` list → query `moderation_flags where status = 'pending'`
- [ ] 7.2 `decide(id, ok)` (Approve/Delete) → call the `resolve_moderation_flag(flag_id, approve)` function already written in `0009_functions_and_triggers.sql` (it updates the flag, fixes the target item/thread, and writes the audit log row in one transaction)
- [ ] 7.3 `modStats` (Pending/Approved/Removed) → `select * from moderation_counts`

**Test:** approve the seeded Samsung Galaxy S24 flag as `superadmin`, confirm the item's status flips back to `active`, the flag disappears from the pending queue, and a row lands in `audit_log`.

---

## Phase 8 — Admin: Members

- [ ] 8.1 `members`/`memberList` → query `profiles` (search via `uq` on `username`/`handle`/`display_name`)
- [ ] 8.2 `toggle` (Suspend/Restore) → `update profiles set is_suspended = ...`
- [ ] 8.3 `remove` → move the row into `deleted_profiles` + `delete from profiles` (do **not** hard-delete `auth.users` casually — decide whether Remove also disables login, e.g. via `supabase.auth.admin.deleteUser` from an Edge Function, and note the decision here)
- [ ] 8.4 A suspended member should be blocked from signing in or from posting — add that check (either in the data-access layer, or reject in RLS on `items`/`forum_threads` insert when `is_suspended`)

**Test:** suspend a member, confirm they can no longer post (per whatever rule you picked in 8.4); restore them and confirm they can again.

---

## Phase 9 — Admin: Analysis

- [ ] 9.1 `bars` (reports this week) → `select * from weekly_report_counts`
- [ ] 9.2 `keywords` (flagged keyword hits) → query `moderation_keywords`
- [ ] 9.3 `sentimentRows`/`scouts` — decorative in the prototype; either drop them, replace with something real (e.g. `active threads` from `forum_threads`), or explicitly keep as static copy. Decide and note here (see `backend/README.md` "What's intentionally not modeled yet").

**Test:** report a few items on different days (or backdate seed rows) and confirm the bar chart reflects real daily counts.

---

## Phase 10 — Admin: Ads

- [ ] 10.1 `adSlots` → `select * from ad_placements_with_status`
- [ ] 10.2 `toggleAd` → `update ad_placements set is_live = not is_live`
- [ ] 10.3 `saveAd` (editor sheet) → `update ad_placements set campaign_id=..., duration_days=..., starts_at=current_date, is_live=true`
- [ ] 10.4 `adCampaigns` (editor picker) → query `ad_campaigns`
- [ ] 10.5 Live ad slots on Home/Registry/Forum/Report-success (`slotFor`) → read from `ad_placements_with_status where screen = ... and is_live`

**Test:** pause the Forum ad as admin, confirm it stops rendering on the Forum screen for a normal user; relaunch it with a new campaign and duration, confirm `days_left` resets.

---

## Phase 11 — Support chat & FAQ

- [ ] 11.1 `faqChips`/keyword matching (`askBot`) → query `faq_entries` instead of the hardcoded `FAQ` array
- [ ] 11.2 `supportMessages` → `select` / `insert into support_messages`
- [ ] 11.3 `escalate()` → flip the newest message (or a status column you may want to add) so a human agent view can pick it up — out of scope for the app itself unless there's an admin support inbox planned; note the decision here

**Test:** ask a question matching a seeded FAQ keyword, confirm the same answer text comes back from the DB instead of the hardcoded array.

---

## Phase 12 — Profile, guidelines, notifications

- [ ] 12.1 Profile sheet (`meName`, `meEmail`, `settings`) → read from `profiles` + `auth.users` email, not `store.me()`'s hardcoded switch
- [ ] 12.2 `acceptGuidelines` → `update profiles set guidelines_accepted_at = now()`
- [ ] 12.3 (stretch) Wire `notifications` — insert a row when someone messages you, claims your item, or a moderator acts on your content; show a bell/badge somewhere reading `notifications where user_id = me and not is_read`

**Test:** accept guidelines as `newuser`, confirm the dashboard checklist item flips to done and persists across a re-login.

---

## Phase 13 — Cleanup

- [ ] 13.1 Delete the now-unused mock arrays from `src/data/constants.ts` (keep `SLIDES`, `CATS`, `STATUS`, `SCREEN_ICON` — pure UI config, not data)
- [ ] 13.2 Update `docs/PARITY.md` / `tools/oracle` — the golden-master oracle compares against the prototype's mock state; decide whether it still makes sense once real data replaces it, or whether it becomes a UI-only/offline-fixture test
- [ ] 13.3 Confirm every screen touched in Phases 1–12 uses the loading/error/empty pattern from 0.9 (not just the ones that happened to need it first)
- [ ] 13.4 Full run-through as all three personas (fresh signup, existing user, superadmin) against the real backend
- [ ] 13.5 Add automated test coverage for the new `src/api/*` data-access layer (unit tests against a local/test Supabase project, or mocked client) — there is currently no test for anything beyond the prototype-parity oracle

---

## Phase 14 — Deployment & ops readiness

Cross-cutting, not tied to one screen — needed before this goes further than your own device.

- [ ] 14.1 Rate limiting / abuse prevention: nothing currently stops one account from spamming reports, messages or forum posts. Add Supabase rate limiting (Auth has built-in limits; app-level actions don't) — e.g. a Postgres check or Edge Function throttle on `items`/`messages`/`forum_threads` inserts per user per minute
- [ ] 14.2 Push notification delivery for the `notifications` table (12.3) — decide on Expo Notifications + a device-token table, or leave as in-app-only for v1 and note the decision
- [ ] 14.3 Supabase project hardening: enable point-in-time recovery / backups on prod, review the [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), turn on leaked-password protection and email-confirmation requirements in Auth settings
- [ ] 14.4 Error/crash monitoring (e.g. Sentry) wired into the Expo app, since Supabase errors now happen off-device and won't show up in a dev console in production
- [ ] 14.5 EAS build/submit: confirm `eas.json` build profiles pick up the right `EXPO_PUBLIC_SUPABASE_*` values per environment (dev/preview/production channels in `eas.json` should map to dev/staging/prod Supabase projects from 0.1)
- [ ] 14.6 `deploy-web.yml` (GitHub Pages) needs the production `EXPO_PUBLIC_SUPABASE_*` values available at build time as repo/environment secrets — currently the web export has nothing to point at
- [ ] 14.7 Revisit RLS with a second pass once real screens are calling it under load — in particular confirm the `items_update_own`/`forum_threads_update_own` policies can't be used to smuggle a status/tag change past what the UI intends (e.g. a user directly calling the API to set `status = 'flagged'` on their own item)

**Test:** create a second Supabase environment (or a branch via `create_branch`), point a preview build at it, and confirm the app runs end-to-end against it without touching prod data.

---

## Notes

- Each phase is independently shippable — you can stop after any phase and have a working app (later screens just keep using mock data until their phase lands).
- Suggested order above follows the dependency chain (auth → items → chat/forum → admin), but Phases 6 (Forum) and 3–5 (Registry/Detail/Chat) don't depend on each other and can be swapped if you'd rather do Forum earlier. Phase 14 items can mostly be pulled earlier too (e.g. do 14.1's rate limiting alongside whichever phase first allows user-generated writes) rather than saved to the very end — they're listed last only because they're easy to defer, not because they must be.
- Tell me which phase/item to start on and I'll do just that slice.
