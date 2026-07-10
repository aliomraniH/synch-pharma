/*
 * Deterministic agent/ledger simulation engine.
 *
 * The simulation mirrors the real coordination spine used to build this site:
 * five agents append entries (claim | knowledge | decision | handoff) to a
 * shared ledger; a compliance sentinel reconciles them into verdicts
 * (current | stale | unverifiable | quarantined).
 *
 * SEEDED RNG ONLY (mulberry32, seed 42 by default) — never the platform RNG.
 * runSim(seed, steps) is a pure function; its output for seed 42 is snapshotted
 * in test/sim-snapshot.json and asserted by scripts/validate.mjs.
 */
import { mulberry32, pick } from './rng'

export type LedgerKind = 'claim' | 'knowledge' | 'decision' | 'handoff'
export type Verdict = 'current' | 'stale' | 'unverifiable' | 'quarantined'
export type Provenance = 'tool' | 'retrieval' | 'synthesized' | 'human'

/** One row of the shared ledger — the atom the whole site is built around. */
export interface LedgerEvent {
  id: string
  kind: LedgerKind
  subject: string
  value: string
  provenance: Provenance
  verdict: Verdict
  actor: string
  seq: number
}

export const ACTORS = [
  'orchestrator',
  'data-steward',
  'partner-liaison',
  'compliance-sentinel',
  'site-success',
] as const

export const KINDS: readonly LedgerKind[] = [
  'claim',
  'knowledge',
  'decision',
  'handoff',
]

export const PROVENANCE: readonly Provenance[] = [
  'tool',
  'retrieval',
  'synthesized',
  'human',
]

/** Subjects are vendor-independent data atoms the spine governs. */
export const SUBJECTS = [
  'site-042/eISF-sync',
  'usdm/protocol-mapping',
  'fhir/subject-status',
  'cdash/adverse-event',
  'dia-eisf/document-index',
  'ich-m11/protocol-section',
  'lab-vendor/sample-manifest',
  'cro/monitoring-visit',
  'regulator/submission-slot',
  'sponsor/activation-metric',
] as const

const KIND_VERB: Record<LedgerKind, string> = {
  claim: 'asserts',
  knowledge: 'records',
  decision: 'commits',
  handoff: 'passes',
}

/** Weighted verdict draw: mostly current, some stale, few unverifiable/quarantined. */
function drawVerdict(rng: () => number): Verdict {
  const r = rng()
  if (r < 0.62) return 'current'
  if (r < 0.82) return 'stale'
  if (r < 0.95) return 'unverifiable'
  return 'quarantined'
}

function buildValue(kind: LedgerKind, subject: string, verdict: Verdict): string {
  return `${KIND_VERB[kind]} ${subject} → ${verdict}`
}

/**
 * Generate exactly one ledger event for a given sequence number.
 * The order of rng() calls is fixed and MUST NOT change — the committed
 * snapshot depends on it byte-for-byte.
 */
export function generateEvent(rng: () => number, seq: number): LedgerEvent {
  const actor = pick(rng, ACTORS)
  const kind = pick(rng, KINDS)
  const subject = pick(rng, SUBJECTS)
  const provenance = pick(rng, PROVENANCE)
  const verdict = drawVerdict(rng)
  const idHex = Math.floor(rng() * 0xffffff)
    .toString(16)
    .padStart(6, '0')
  const id = `lg-${String(seq).padStart(4, '0')}-${idHex}`
  return {
    id,
    kind,
    subject,
    value: buildValue(kind, subject, verdict),
    provenance,
    verdict,
    actor,
    seq,
  }
}

/**
 * Pure, deterministic run. Returns the first `steps` ledger events for a seed.
 * This is the function scripts/validate.mjs asserts against the snapshot.
 */
export function runSim(seed: number, steps: number): LedgerEvent[] {
  const rng = mulberry32(seed)
  const events: LedgerEvent[] = []
  for (let seq = 0; seq < steps; seq++) {
    events.push(generateEvent(rng, seq))
  }
  return events
}

/**
 * Stateful wrapper for the interactive SPINE act. Steps the same deterministic
 * stream the validator checks, and lets a visitor inject a stale fact and watch
 * reconciliation catch it.
 */
export class LedgerSimulation {
  readonly seed: number
  private rng: () => number
  private seq = 0
  events: LedgerEvent[] = []

  constructor(seed = 42) {
    this.seed = seed
    this.rng = mulberry32(seed)
  }

  /** Append the next deterministic event. */
  step(): LedgerEvent {
    const evt = generateEvent(this.rng, this.seq++)
    this.events.push(evt)
    return evt
  }

  /**
   * Visitor action: inject a stale, unverifiable copy of a subject the ledger
   * already holds. Reconciliation (below) will flag it.
   */
  injectStale(subject: string): LedgerEvent {
    const evt: LedgerEvent = {
      id: `lg-${String(this.seq).padStart(4, '0')}-injctd`,
      kind: 'claim',
      subject,
      value: `asserts ${subject} → (unverified external copy)`,
      provenance: 'retrieval',
      verdict: 'unverifiable',
      actor: 'external-portal',
      seq: this.seq++,
    }
    this.events.push(evt)
    return evt
  }

  /**
   * Reconcile: the newest live claim per subject wins; older claims for the same
   * subject flip to `stale`; unverifiable injected copies stay flagged. Returns
   * the number of entries whose verdict changed.
   */
  reconcile(): number {
    const newestSeqBySubject = new Map<string, number>()
    for (const e of this.events) {
      const prev = newestSeqBySubject.get(e.subject)
      if (prev === undefined || e.seq > prev) {
        newestSeqBySubject.set(e.subject, e.seq)
      }
    }
    let flipped = 0
    for (const e of this.events) {
      if (e.verdict === 'unverifiable' || e.verdict === 'quarantined') continue
      const newest = newestSeqBySubject.get(e.subject)
      const shouldBe = e.seq === newest ? 'current' : 'stale'
      if (e.verdict !== shouldBe) {
        e.verdict = shouldBe
        e.value = buildValue(e.kind, e.subject, shouldBe)
        flipped++
      }
    }
    return flipped
  }

  reset(): void {
    this.rng = mulberry32(this.seed)
    this.seq = 0
    this.events = []
  }
}
