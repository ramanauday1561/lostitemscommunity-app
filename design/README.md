# Design

Product and architecture documentation that sits above any single layer of
the codebase — how the pieces fit together, the data model, and the role
model. Code lives in the repo root (frontend, an Expo/React Native app) and
in `backend/` (Supabase schema); this folder is where decisions that span
both are written down.

- [`architecture.md`](./architecture.md) — folder layout, entity-relationship
  diagram, and the role matrix (superadmin vs. user) across every screen.

See also `docs/PARITY.md` at the repo root, which documents how the frontend
stays in lockstep with `prototype/Lost Items App v3 (native).dc.html` — that
doc is frontend-specific (it's tied to `tools/oracle/`) so it stays next to
the code it verifies rather than moving here.
