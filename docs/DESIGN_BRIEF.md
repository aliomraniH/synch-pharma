# SynchPharma — Design & Build Brief (v1)
Written on: Claude web (surface 1) · Namespace: dev/synch-pharma · Repo: github.com/aliomraniH/synch-pharma (currently EMPTY — first push creates main)

## 1. Concept
SynchPharma is a fictional-but-plausible new pharma arm whose differentiator is coordination architecture:
it does not force partners (sites, CROs, vendors, labs, regulators) onto its portal. Instead it runs a
shared, verifiable coordination spine. Thesis: "Govern the data, not the workflow — standardize what must
be true, liberate how it gets done."

The website must EXPLAIN this by BEING it: the interactive interface simulates agents exchanging
verified claims and handoffs across partner systems.

## 2. Audience & goal
Investigative sites, vendor partners, and pharma execs. Goal: in 3 minutes of interaction, a visitor
understands why a claims/reconcile/handoff spine beats a portal.

## 3. Site IA (single-page app, 5 acts)
1. HERO — "One truth layer. Zero new logins." Animated network of partner nodes.
2. THE PROBLEM — portal sprawl (fragmented logins, stale copies of truth). Interactive "portal fatigue" counter.
3. THE SPINE — interactive simulation: 5 agents pass claims/handoffs through a shared memory ledger.
   Visitor can inject a stale fact and watch reconciliation catch it.
4. HOW PARTNERS PLUG IN — sites keep their own eISF/CTMS; SynchPharma governs data atoms + integrity
   guardrails + outcomes. Vendor-independent standards row: USDM, FHIR, CDASH, DIA eISF, ICH M11.
5. PROOF & CONTACT — precedent strip (ISO 20022, open banking, Digital Data Flow) + CTA.

## 4. Product architecture the site simulates (= the multi-agent model)
- ORCHESTRATOR — routes work, owns the ledger view.
- DATA STEWARD — writes claims with provenance; rejects unverifiable facts.
- PARTNER LIAISON — handoffs to/from site & vendor systems.
- COMPLIANCE SENTINEL — reconciles claims, flags stale/colliding entries, quarantines instruction-shaped content.
- SITE SUCCESS — reads verified state, computes sponsor-of-choice metrics (activation time, query rate).
Ledger semantics mirror the real spine used to build this site: claim | knowledge | decision | handoff,
verdicts current | stale | unverifiable, quarantine on suspicious writes.

## 5. Design tokens (inherit from roche_deliverable_system.html)
- bg #E5E9EE · panel #F7F9FB · card #FFFFFF · ink #152437 · muted #5C6D7F · line #C6D1DB
- teal #0E767E (foundation) · amber #A96C25 (sensor) · indigo #544CA0 (governance) · green #2A7452 (capability)
- Fonts: Space Grotesk (display), Inter (body), IBM Plex Mono (labels/ledger)
- Motion: SVG dataflow pulses along edges; ledger rows type in monospace; verdict chips flip color.

## 6. Tech constraints
- Static site, no backend: Vite + vanilla TS or React; single deployable /dist; GitHub Pages-ready.
- Simulation is deterministic + seeded (so QA validator can assert on it). No external API calls at runtime.
- Accessibility: prefers-reduced-motion honored; keyboard-navigable simulation.

## 7. Build-time agent team (Cowork subagents)
- narrative-agent (frontier tier): copy, story arc, act transitions.
- design-system-agent (frontier): tokens -> CSS variables, components.
- sim-engine-agent (cheap tier + conventions doc): deterministic agent/ledger simulation engine (pure TS, unit-tested).
- frontend-agent (cheap tier + conventions doc): assembles acts into the SPA.
- qa-validator-agent (cheap tier): runs scripts/validate.mjs (build passes, required sections present,
  sim determinism snapshot, no console errors, lighthouse-ish checks).
Routing rule: procedural work -> cheap tier + CONVENTIONS.md + deterministic validator; judgment/authoring -> frontier.

## 8. Definition of done (P1)
- `npm run build` green; validator green; deployed preview; all 5 acts interactive.
- Every milestone written to dev/synch-pharma as a claim with meta.repo + meta.branch (+ sha) so
  coord_reconcile can verify it against GitHub.
