# Lost Items Community — mobile app

React Native (Expo SDK 57) client for [lostitemscommunity.com](https://lostitemscommunity.com),
backed by Supabase.

Build order, per-screen checklists and build prompts live in the
[management hub](https://ramanauday1561.github.io/lostitemscommunity-management/).

## Run it on your phone (no laptop needed)

Expo Go is **not** used here: it needs a dev server running on a computer.
Instead this project uses an **Android development build** installed once from a
link, after which every JS change arrives over the air via EAS Update.

**One-time setup**

1. Create/connect the project on [expo.dev](https://expo.dev) and link this GitHub repo.
2. Set `EAS_PROJECT_ID` (or paste the id into `app.config.ts`).
3. Run the `Create Android development build` workflow.
4. Open the build's install link on the phone and install the APK.

**Everyday loop**

Push to `main` or any `claude/**` branch. `publish-update.yml` publishes an update
to the `development` branch; reopen the app on the phone to pick it up.
A rebuild is only needed when the **native** side changes — a new native module,
a config plugin, or an SDK bump. The fingerprint runtime policy enforces this
automatically: an incompatible update will not be offered to an old build.

**With a computer (optional)**

```bash
npm install && npm start
```

## What works today

| Screen | State |
| --- | --- |
| Welcome / onboarding | 3-slide carousel |
| Login · Sign up · Forgot password | live Supabase auth |
| Registry (Home) | live — fetch, search, filter, pull-to-refresh |
| Report an item | live — inserts to `items`, trigger assigns the short code |
| Report success | live — shows the generated `LOST-####` / `FOUND-####` |
| Item detail | live fetch |
| Profile | live profile + sign out |
| Community forum | placeholder — Phase 4 |
| Messages inbox | placeholder — Phase 3 |

## Layout

```
app/                    expo-router routes (file = screen)
  (auth)/               welcome, login, signup, forgot
  (tabs)/               registry, forum, report, inbox, profile
  item/[id].tsx         item detail
src/lib/supabase.ts     client, AsyncStorage session persistence
src/lib/auth.tsx        AuthProvider + useAuth
src/lib/database.types.ts
src/theme/tokens.ts     colours/spacing/type from the prototype
src/components/ui.tsx   Button, Field, Card, Pill, states
```

## Configuration

`app.config.ts` carries the Supabase URL and **publishable** key. Those are safe to
commit — the publishable key grants only what Row Level Security allows, and every
table has RLS enabled. Override per environment with `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Never put the `service_role` key in this repo.

## Checks

```bash
npm run lint      # tsc --noEmit
npx expo export --platform ios    # proves the bundle builds
```
