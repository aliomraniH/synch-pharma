# CONVENTIONS.md — SynchPharma build handbook

One page. Every subagent **must read this before writing any code.** It exists so
procedural work can run on the cheap tier and still pass `scripts/validate.mjs`
deterministically. When in doubt, follow the convention literally.

## File layout

```
src/sim/          deterministic simulation engine (pure TS, no DOM)
src/acts/         one module per act (hero, problem, spine, partners, proof)
src/tokens.css    design tokens (CSS custom properties) — the only place hex lives
src/app.css       component styles that consume tokens
src/main.ts       mounts every act into its <section data-act="…"> host
scripts/          validate.mjs (gate) + gen-snapshot.mjs (snapshot writer)
test/             sim-snapshot.json (committed determinism fixture)
docs/             DESIGN_BRIEF.md
```

## Naming

- Files: **kebab-case** (`sim-snapshot.json`, `design-system-agent.md`).
- Components / exported types: **PascalCase** (`LedgerSimulation`, `LedgerEvent`).
- Functions / variables: camelCase. Constants: UPPER_SNAKE only for frozen tables.

## The ledger entry type (the atom everything is built around)

```ts
type LedgerEvent = {
  id: string
  kind: 'claim' | 'knowledge' | 'decision' | 'handoff'
  subject: string
  value: string
  provenance: 'tool' | 'retrieval' | 'synthesized' | 'human'
  verdict: 'current' | 'stale' | 'unverifiable' | 'quarantined'
  actor: string
  seq: number
}
```

Semantics mirror the real coordination spine: `claim` = verifiable assertion about
mutable external state; `knowledge` = durable fact; `decision` = a commitment;
`handoff` = passing work between agents. Verdicts are assigned by reconciliation,
never hand-set except for the demo `injectStale` path.

## Seeded RNG rule (NON-NEGOTIABLE)

- The only randomness source in `src/sim/` is **mulberry32** seeded with **42**.
- **NEVER** use the platform RNG (`Math.random`) anywhere under `src/sim/`.
  The validator greps for it (comments excluded) and fails the build if found.
- The order of `rng()` calls inside `generateEvent` is frozen — changing it
  breaks `test/sim-snapshot.json`. If you must change generation, regenerate the
  snapshot with `npm run snapshot` and commit it in the same change.

## Act module contract

Every file in `src/acts/` (except `act.ts`) exports **default** an object:

```ts
{ id, title, mount(el: HTMLElement, ctx: ActContext): void }
```

`id` must be one of: `hero`, `problem`, `spine`, `partners`, `proof`. `mount`
writes into the provided host element and must honor `ctx.prefersReducedMotion`.

## Commit message format

`area: imperative summary` — e.g. `sim: add reconcile verdict flip`,
`acts: build partners standards row`, `chore: scaffold vite spa`.

## Definition of done for any change

`npm run build` green **and** `npm run validate` green before you hand off.
