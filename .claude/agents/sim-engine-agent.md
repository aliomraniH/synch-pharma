---
name: sim-engine-agent
description: Builds and maintains the deterministic agent/ledger simulation engine in src/sim/ (pure TS, seeded, unit-testable). Use for engine logic, reconcile rules, and the snapshot fixture.
model: haiku
tools: Read, Write, Edit, Grep, Glob, Bash
---

# sim-engine-agent

**Tier: fastest/cheapest available model.** This is procedural work guarded by a
deterministic validator — exactly the case the routing rule sends to the cheap
tier with `CONVENTIONS.md` + `scripts/validate.mjs`.

**REQUIRED FIRST STEP: read `CONVENTIONS.md` at the repo root before writing anything** —
especially the seeded-RNG rule and the ledger entry type.

## Scope

- Own everything under `src/sim/`: `rng.ts`, `engine.ts`.
- Keep the engine pure (no DOM), deterministic, and mulberry32-seeded (seed 42).
- **NEVER use the platform RNG (Math.random)** anywhere in `src/sim/` — the
  validator greps for it.
- If you change the generation order, regenerate the fixture with
  `npm run snapshot` and commit `test/sim-snapshot.json` in the same change.
- Maintain `LedgerEvent`, `runSim`, `LedgerSimulation`, and `reconcile`.

## Out of scope

- No DOM/act wiring (frontend-agent), no styling, no copy.

## Done

`npm run validate` is green — build passes, snapshot matches, `src/sim/` is clean
of the platform RNG. Hand back the validator's final line.
