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

- [x] 1.1 `src/screens/Login.tsx` → `supabase.auth.signInWithPassword` via `src/api/auth.ts#signIn`, replacing `store.signIn` **only when the new demo/Supabase switch is set to "Supabase account"**. `store.signIn`/`store.quick` (demo mode) are untouched — see the switch note below.
- [x] 1.2 On successful sign-in, `getMyProfile()` fetches the caller's `profiles` row and `Store#roleFromProfile` derives `role`/`fresh` from it (`role`, `post_count`, `guidelines_accepted_at`) — no more username string-matching in the real path.
- [x] 1.3 `src/screens/Signup.tsx` → `supabase.auth.signUp` with `data: { username, handle, display_name }` via `src/api/auth.ts#signUp`, which also pre-checks `username_available()` for a friendly "that username is taken" instead of a raw constraint error.
- [x] 1.4 `src/screens/Forgot.tsx` → **decision:** dropped the fake 6-digit-code UI for Supabase mode. `resetPasswordForEmail` sends a real link; the screen collapses to a 2-step "enter email → check your inbox" flow (see `fpCopy`/`fpPrimary` branching on `authMode` in `selectors.ts`). The link itself isn't handled in-app yet (no deep-link screen for the recovery redirect) — that's a follow-up, not this phase; noted in Phase 14 candidates below. Demo mode keeps the original 4-step mock flow unchanged.
- [x] 1.5 `logout()` → calls `signOutSupabase()` when `authMode === 'supabase'`, then resets local state same as before.
- [x] 1.6 Session persistence: `Store#restoreSession` (called from `StoreProvider` on mount) checks `getSession()` and routes straight to the dashboard with the right role if one exists.

**Decision — temporary demo/Supabase switch:** added a segmented control at the top of Login (`authModeOptions` in `selectors.ts`, rendered with the existing `Seg` component). "Demo data" (default) is the original mock-data path, completely unchanged — same quick logins, same social buttons, same synchronous `store.signIn`. "Supabase account" swaps in the real API calls and hides the quick-logins/social rows (which are meaningless against a real backend). This is scaffolding for testing both paths side by side during the rollout; remove the switch and delete the demo path once every phase is wired and verified (tracked as a Phase 13 follow-up).

**Decision — username *and* email login:** `src/api/auth.ts#signIn` accepts either. A bare string with no `@` is resolved through the new `email_for_username()` RPC (`backend/supabase/migrations/0016_username_login.sql`) before calling `signInWithPassword`. **Trade-off, accepted deliberately:** this lets an unauthenticated caller learn whether a given username exists (the RPC returns `null` vs. an email), though not the password. This reverses the "email-only login" decision recorded in Phase 0 — the user explicitly asked for username-or-email support, so the trade-off is accepted and documented rather than silently overridden. Mitigate with rate limiting later (Phase 14).

**Verified:**
- `npx tsc --noEmit` clean, `npm run oracle` 46/46 (new `AppState` fields don't touch any prototype-compared key; the oracle's `diff()` only compares shared keys, so this is safe by construction — see `tools/oracle/normalise.mjs`).
- `store.ts`'s Supabase calls are behind `await import('../api/auth')` (not a static top-level import), because `../api/auth` → `../lib/supabase` → `react-native-url-polyfill/auto`, which the Node-based oracle can't transform outside Metro. Static import broke `npm run oracle`; dynamic import fixed it without changing any behavior (Store methods are already `async`).
- Database-level: verified `email_for_username()` resolves a real username to its email and returns `null` for an unknown one; verified the stored bcrypt hash matches the correct password and rejects a wrong one (`crypt(password, encrypted_password) = encrypted_password`, the same comparison GoTrue itself performs) — see the test-users table below.
- UI, via a real headless-browser run against `expo start --web` (screenshots below): the demo/Supabase toggle, hiding of quick-logins/social rows in Supabase mode, Signup's live password-match indicator, and the collapsed Forgot-password copy all render correctly.
- **Not verified live end-to-end (network-blocked):** this sandbox's outbound network policy denies direct HTTPS to `*.supabase.co` (confirmed via `curl` — the egress proxy answers `403` to the `CONNECT`) even from a headless browser running inside the session. So an actual `signInWithPassword` round-trip triggered from the browser cannot complete here; only the Supabase MCP tool (a separate, allow-listed connector) can reach the project from this session. The "wrong password" / "unknown user" screenshots below show the correct **generic, no-enumeration error UI**, but that path was reached because the resolveEmail RPC call itself failed closed (network error treated the same as "not found") — it does not prove a live password check. The bcrypt comparison above is what actually proves the credential logic; a live network test needs either a local dev machine/EAS build, or this environment's Network access setting widened to include `*.supabase.co` (environment settings → Edit → Network access).

**Bug found after the fact — real logins were failing everywhere except this sandbox.** `src/lib/supabase.ts` throws if `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` aren't set. Those only ever existed in this session's local `.env` (correctly gitignored, per 0.4) — nobody else had them:
- A fresh clone (anyone else's machine, or this checklist's own "local dev machine" suggestion above) has no `.env` at all, so Supabase mode throws on first use.
- `.github/workflows/deploy-web.yml` (the `app.lostitemscommunity.com` GitHub Pages build) never set these either, so the live site had the same problem.
- **Fix:** added a committed `.env.production` (unlike `.env`, not gitignored — these values are meant to be public, protected by RLS, not by secrecy). Expo's CLI automatically loads `.env.production` for `expo export`/production builds, so this fixes the GitHub Pages deploy with no CI secret configuration needed, and also means `expo export -p web` works out of the box for anyone. Verified by moving `.env` aside and re-running `expo export -p web`: the log line `env: load .env.production .env` confirms it falls back correctly, and the real project URL is present in the built JS bundle. Local dev (`expo start`, not a production build) still needs its own `.env` — copy `.env.example` and fill in the same public values (see `backend/README.md`), since Expo only auto-loads `.env.production` in production mode.
- This should have been caught in the original Phase 0/1 verification — it wasn't, because that verification only ran inside this sandbox, where the local `.env` masked the gap. Flagging the miss rather than glossing over it.

---

## Phase 2 — Dashboard

- [x] 2.1 `myStats` → `src/api/dashboard.ts#getMyDashboardStats(userId)`: active reports (`items` where `reporter_id = me` and `status = 'active'`), reunited count, forum post count (`profiles.post_count`, covers threads + replies — a closer match to the "Forum posts" label than counting threads alone). Only replaces the value in **Supabase mode**; demo mode's hardcoded numbers are untouched.
- [x] 2.2 `setupSteps`/`setupProgress` → `st.suTerms` (already synced from `profiles.guidelines_accepted_at` since Phase 1's `roleFromProfile`), `myDashStats.totalReports > 0`, `myDashStats.myThreads > 0` (a real `forum_threads` count, not `profiles.post_count`, since a reply shouldn't mark "say hello in the forum" done before a thread has ever been posted).
- [x] 2.3 Admin dashboard tiles (`adminMetrics`) → `select * from admin_dashboard_stats`, via `getAdminDashboardStats()`. Renamed the third tile from "Scouts online" to **"Active members"** since it now shows a real count instead of a fake presence number (see `backend/README.md` "What's intentionally not modeled yet") — dropped the `delta` copy (`"↓ 36.8% vs last month"` etc.) too, since there's no historical baseline to compare against yet.
- [x] Added `profile: Profile | null` to `AppState`, populated by `roleFromProfile()` on every successful sign-in/signup/session-restore and cleared on logout — a single source of truth other phases (Phase 12's Profile sheet, especially) can reuse instead of re-fetching.
- [x] Stats load fire-and-forget via `Store#loadDashboardStats`, called right after `roleFromProfile` on all three auth entry points (sign-in, sign-up, session restore). While it's in flight, `myDashStats`/`adminDashStats` are `null` and the tiles show `0` — no spinner. This is a placeholder, not the loading-state pattern promised in 0.9, which is still undecided; revisit once a screen needs something better than "shows zero briefly."

- [x] 2.4 **Follow-up, added after the fact:** the first pass left every not-yet-wired section (`handedIn`/`comments`, the ad banner, `flaggedCount`/`flagged`, the "Conversation & sentiment" panel, "857 new scouts today") rendering their mock content even in **Supabase mode** — a real logged-in account saw fake data mixed in with their real stat tiles, with no visual distinction. Fixed:
  - `flaggedCount`/`flaggedEmpty`/`flagged` now read `0`/`true`/`[]` in Supabase mode instead of the mock `st.flagged` array — this is the *correct* real value (the `moderation_flags` table is genuinely empty; Phase 7 just hasn't built a way to add to it yet), so the section stays visible and correctly shows "Queue clear" rather than needing to be hidden.
  - `Store#slotFor` now returns `{ live: false }` unconditionally in Supabase mode — one change that suppresses every ad slot app-wide (`AdSlot` already renders `null` when not live), rather than special-casing each screen.
  - Sections with no "real but currently zero" equivalent — `handedIn`/`comments` (Recently handed in / Community activity / Happening near you — Phase 3/5/6), the ad-revenue summary row (Phase 10), "Conversation & sentiment" and "857 new scouts today" (decorative, never planned to become real — see `backend/README.md` "What's intentionally not modeled yet") — are now conditionally hidden behind `!v.isSupabaseAuthMode` in `Dashboards.tsx`, rather than showing fabricated numbers next to a real account's genuine stats. They'll reappear (with real data, not mock) as their respective phases land, except the two decorative ones, which stay hidden for good.
  - Bonus catch while in there: `FreshDash`'s welcome banner hardcoded `"Welcome to Lost Items Community, Nadia."` regardless of who actually signed up. Added `v.freshName`, sourced from `profiles.display_name` in Supabase mode.
  - Demo mode is byte-for-byte unchanged — confirmed with a screenshot of the demo "Simple User" dashboard showing every mock section still in place.

**Verified:** `npx tsc --noEmit` clean, `npm run oracle` 46/46 (oracle only exercises demo-mode state, which none of these changes touch). Confirmed the actual numbers a real login would show, straight from the DB: `admin_dashboard_stats` currently reads `{active_lost: 0, recovered: 0, active_members: 3}` (3 profiles exist: `superadmin`, `testuser1`, `testuser2`; 0 items, since Phase 3/4 haven't given anyone a way to create one against the real backend yet) — this is correct, not a bug, and will move once Phase 4 lands. **Not verified via a live browser round-trip** — same network restriction as Phase 1 (this sandbox can't reach `*.supabase.co`); the checked-in code paths were reviewed against the actual RLS policies instead (`items_select_public`/`forum_threads_select` both permit a user to count their own rows regardless of status, confirmed by re-reading the policies in `0010_rls_policies.sql`).

**Test:** as `newuser`/`testuser2` (fresh, no items yet), dashboard shows the onboarding checklist with nothing done and all-zero grey stat tiles; as `testuser1`, stats should currently read 0 active reports / 0 reunited / 0 forum posts too (no items or threads exist for it yet — expected, not a bug); as `superadmin`, tiles should read `0 / 0 / 3` right now. Once Phase 4 lets `testuser1` report something, its stats and `active_lost` should move.

---

## Phase 3 — Registry (Lost / Found list, search, filters)

- [x] 3.1 Replace `st.lost`/`st.found` with a query against `items` filtered by `kind` — `src/api/items.ts#listItems`, called from `Store#loadRegistry`.
- [x] 3.2 Wire `filters` (`All`/`My posts`/`Active`/`Resolved`/`Reunited`/`Flagged`) to real `where` clauses instead of client-side `.filter()` — `.eq('reporter_id', userId)` for "My posts", `.eq('status', filter.toLowerCase())` otherwise.
- [x] 3.3 Wire the search box (`q`) to a simple `ilike` across `title`/`location_text`/`display_id` (debounced 300ms in `Registry.tsx`). **Decision:** plain `ilike`, not `items_search_idx`/`to_tsvector` — dataset is small enough for now; revisit if search gets slow with real volume.
- [ ] 3.4 Paginate or infinite-scroll instead of loading the whole table — deferred; still a flat `.limit(50)`. Fine at current data volume, revisit alongside 4.x when real users start generating items at scale.

**Test:** as `user`, "My posts" filter shows only items you reported; as `superadmin`, the `Flagged` filter shows the seeded flagged Samsung Galaxy S24; search for a title substring and confirm it narrows correctly.

**Verified live** (2026-09-25, headless Chromium via Playwright, against the real `app.lostitemscommunity.com` build running locally): logged in as `testuser1` over real Supabase Auth and walked the Registry screen end to end —
- Lost/All correctly returns `LOST-1031` "Blue backpack with laptop" (resolves an earlier ambiguity where a screenshot taken too soon after navigation appeared empty — a clean re-run confirms it's a genuine, correct result, not a timing race).
- Lost/My posts correctly narrows to the same item (owned by `testuser1`).
- Found/All correctly returns `FOUND-2018` "Set of house keys".
- Found search for "keys" correctly matches; search for a nonsense string correctly renders the "Nothing matches that" empty state.
Screenshots: `01-testuser1-dashboard`, `02-lost-all`, `03-lost-my-posts`, `04-found-all`, `05-found-search-keys`, `06-found-search-no-match`.

---

## Phase 4 — Item detail, report, claim, withdraw

- [x] 4.1 Detail sheet (`sel`, `detailRows`) → reads from `st.dbItems` (the already-loaded registry list) instead of re-fetching by id. **Decision:** no extra round trip — every entry point into Detail in Supabase mode goes through the Registry list first, so the row (including the reporter's uuid, added as `Item.dbId`/`reporterId`) is already in memory. `item_photos` still isn't rendered in Detail at all — the frontend has never had photo display UI, mock or real (only the Report sheet's upload button), so there was nothing to wire up there. **Bug fix while in here:** `sel` and `canClaim`/`isOwner` previously always read the mock `st.lost`/`st.found` arrays and compared `sel.by` against the hardcoded demo username `'simple.user'` — real accounts could never correctly claim or own anything. Both now branch on `isSupabaseAuth` (`sel` reads `st.dbItems`; ownership compares against `st.profile.handle`).
- [x] 4.2 Report sheet (`reportNext`) → `src/api/items.ts#createItem`, `insert into items` with `display_id` sent as `null` (cast around the generated Insert type) so the `set_item_display_id` trigger assigns it.
- [x] 4.3 "Add a photo" → `expo-image-picker` (installed, `~57.0.20` pinned to the project's Expo SDK) opens the OS/web file picker; the picked image is held in memory (`st.rPhotoBlob`) and uploaded to the `item-photos` bucket + an `item_photos` row inserted once the report itself is submitted (a failed photo upload doesn't undo an already-created report).
- [x] 4.4 Owner actions: `toggleHandover`/`ownerStatuses` → `src/api/items.ts#updateItemStatus`, `update items set status = ...`.
- [x] 4.5 `withdrawPost` → `deleteItem`, `delete from items`.
- [x] 4.6 `claim()` → `claimItem`, `insert into conversations` via `upsert(..., { onConflict: 'item_id,claimant_id', ignoreDuplicates: true })`. **Decision:** stops at creating the row and closing the sheet with a flash message — it does not open the chat sheet, since that reads real conversations/messages, which is Phase 5's job. `claimLabel`/chat UI wiring picks this up then.
- [x] 4.7 `flagRecord` → `flagItem`, `insert into moderation_flags` + sets the item's status to `flagged` (admin-only, matches the existing `v.isAdmin` gate on this button). **Bonus:** `deleteRecord` (the admin hard-delete button next to it) was wired too, reusing `deleteItem` — not in the original checklist bullets but it's the other half of the same admin action row.

**Verified live** (2026-09-25, headless Chromium via Playwright, against the real `app.lostitemscommunity.com` build running locally):
- As `testuser1`: reported a new item ("E2E test wallet") through both report steps including attaching a real photo (Playwright's filechooser API driving the web `<input type=file>` expo-image-picker creates) — confirmed the row landed in `items` with a generated `display_id` (`LOST-1034`) and the photo landed in the `item-photos` bucket at `<uploader>/<item>/<timestamp>.jpg`, matching the storage RLS path convention. Opened the new item's Detail sheet, tapped "Mark as handed over" (confirmed status flipped to Reunited and stuck across a re-open), then withdrew it (confirmed it disappeared from the registry). Test item + its DB rows were deleted afterward to keep the project's real data clean.
- As `testuser2` (a second account, not the reporter): opened `testuser1`'s seeded item and confirmed the correct "I have found this" claim button now shows (the `meHandle` bug fix above), claimed it, then claimed it again — confirmed exactly one `conversations` row exists despite the double claim.
- As `superadmin`: flagged the same item, confirmed it shows a "Flagged" status chip and the correct `flagged` status. Test moderation flag/conversation rows and the status were reset afterward to restore the seed item to its original state.
- `npx tsc --noEmit` clean; `npm run oracle` 46/46 (demo mode untouched).

**Note:** `testuser2`'s password was reset (via direct SQL, same mechanism as the original superadmin bootstrap) to run the claim test, since its original password wasn't recorded in this checklist. New password: `Phase4Test!99` — update your notes if you were using the old one.

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
