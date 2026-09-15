# Lost Items Community — mobile app

React Native (Expo SDK 57) client for [lostitemscommunity.com](https://lostitemscommunity.com),
backed by Supabase.

Build order, per-screen checklists and build prompts live in the
[management hub](https://ramanauday1561.github.io/lostitemscommunity-management/).

## Run it on your phone

```bash
npm install
npm start
```

Then scan the QR code with **Expo Go** ([iOS](https://apps.apple.com/app/expo-go/id982107779) ·
[Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).
Expo Go is free, and your phone must be on the same Wi-Fi as the machine running `npm start`.
If the two can't see each other, use `npx expo start --tunnel`.

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
