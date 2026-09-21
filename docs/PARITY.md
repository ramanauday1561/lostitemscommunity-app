# Parity with the prototype

The source of truth is `prototype/Lost Items App v3 (native).dc.html`:
template lines 9–1265, data 1267–1401, logic and selectors 1403–2173.

## How parity is enforced

`renderVals()` in the prototype is a pure function of state, so it runs as a
test oracle. `tools/oracle/check.ts` evaluates it and this app's `buildVals()`
over the same 46-case state matrix (`tools/oracle/cases.mjs`) and diffs the
result. Styles are excluded — CSS and React Native express them differently —
so what is compared is every label, id, count, ordering and computed value.

```
npm run oracle     # 46/46 cases match the prototype
npm run typecheck
```

This runs in CI on every push (`.github/workflows/checks.yml`).

## Screens (13) — all ported

welcome (3 slides) · login · signup · forgot-password (email → code → reset →
done) · dashboard ×3 roles · lost registry · found registry · forum ·
moderation · analysis · members · messages · ad placements

## Bottom sheets (10) — all ported

detail · report (2 steps + tappable map pin) · sent · chat · thread ·
new thread · support · profile · guidelines · ad editor

Each keeps the prototype's split between a scrolling body and a separate
footer action bar.

## Roles (3)

`admin`, `user`, `new` — each changing nav tabs, header titles, filter sets,
FAB visibility, inbox visibility, ad gating and profile settings.

## Timings preserved

| Behaviour | Delay |
|---|---|
| Chat auto-reply from the finder | 1600ms |
| Support bot reply | 900ms |
| Sign in | 600ms |
| Quick login | 550ms |
| Forgot-password send | 650ms |
| Toast dismissal | 2400ms |
| Chat scroll-to-end | 0, 60, 220, 450ms |

## Deliberate differences

| Prototype | Here | Why |
|---|---|---|
| `public/images/…` | `assets/images/` via an asset map | Those paths are broken in the prototype; the files live in `prototype/images/` |
| `document.querySelector('[data-chat-scroll]')` | `ScrollView` ref | No DOM on native |
| `getBoundingClientRect()` / `e.clientX` | `nativeEvent.locationX/Y` | Same |
| CSS `style-active` | `Press` component | Reproduces the scale-down and background shift on every button |
| CSS shadows | RN `boxShadow` | Same values, supported on both targets |

## Verified interactively

Checked in a headless browser against the running build: quick logins for all
three roles, registry search and filters, item detail, claim → chat with the
1600ms reply, forum post creation, support bot FAQ keyword matching,
moderation approve (counters 3→2 pending, 0→1 approved, exact toast copy),
member suspend, and ad placement figures ($6,510 revenue, 152K impressions,
3/4 slots live, 3.1% avg CTR) matching the oracle exactly.
