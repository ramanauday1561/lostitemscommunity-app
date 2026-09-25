# src/api

Data-access layer for Supabase. Screens/selectors call functions from here —
never `supabase.from(...)` or `supabase.auth.*` directly from a screen or
`src/state/selectors.ts`. Keeps `Store` swappable phase by phase (see
`backend/INTEGRATION_CHECKLIST.md`) instead of a big-bang rewrite, and gives
every query one place to add the loading/error handling pattern from
checklist item 0.9.

One file per domain, filled in as each phase lands:

- `auth.ts` — Phase 1
- `dashboard.ts` — Phase 2
- `items.ts` — Phases 3-4
- `chat.ts` — Phase 5
- `forum.ts` — Phase 6
- `moderation.ts` — Phase 7
- `members.ts` — Phase 8
- `analysis.ts` — Phase 9
- `ads.ts` — Phase 10
- `support.ts` — Phase 11
- `profile.ts` — Phase 12

Import the client from `src/lib/supabase.ts`.
