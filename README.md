# SynchPharma

Interactive single-page site for a fictional pharma arm whose differentiator is
**coordination architecture**: it doesn't force partners onto a portal, it runs a
shared, verifiable coordination spine. Thesis — *govern the data, not the
workflow*. The site explains this by **being** it: an interactive simulation of
agents exchanging verified claims and handoffs through a shared ledger.

Built as surface 2 of a 3-surface sync test (Claude web → Claude Cowork desktop →
optional Cursor verify). See `docs/DESIGN_BRIEF.md`.

## Stack

Vite + TypeScript static SPA, deterministic seeded simulation, GitHub
Pages–ready (`base: /synch-pharma/`). No backend, no runtime API calls.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # tsc typecheck + vite build -> dist/
npm run validate   # deterministic gate (build, act ids, sim snapshot, no platform RNG)
npm run snapshot   # regenerate test/sim-snapshot.json (only when engine changes)
```

## The five acts

1. **hero** — "One truth layer. Zero new logins." + animated partner network.
2. **problem** — portal sprawl, interactive portal-fatigue counter.
3. **spine** — the live, seeded ledger simulation (append / inject stale / reconcile).
4. **partners** — how partners plug in; vendor-independent standards.
5. **proof** — precedent strip (ISO 20022, Open Banking, DDF) + CTA.

## Conventions & agents

Procedural work follows `CONVENTIONS.md` and is gated by `scripts/validate.mjs`.
Build-time subagent definitions live in `.claude/agents/`.
