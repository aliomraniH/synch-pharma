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

/** Metrics about site success based on verified entries (excluding quarantined). */
export interface SiteSuccessMetrics {
  activationDays: number
  queryRatePct: number
  verifiedSharePct: number
  quarantinedExcluded: number
}

/**
 * Tracks a pending injection awaiting compliance-sentinel detection and flagging.
 * The sentinel flags within at most 3 ticks, deterministically based on seq.
 */
interface PendingInjection {
  event: LedgerEvent
  injectedAtSeq: number
}

/**
 * Stateful wrapper for the interactive SPINE act. Steps the same deterministic
 * stream the validator checks, and lets a visitor inject stale/suspicious facts
 * and watch the compliance-sentinel reconciliation catch them.
 *
 * Tick-based deterministic simulation of five product agents:
 * - orchestrator, data-steward, partner-liaison, compliance-sentinel, site-success
 */
export class LedgerSimulation {
  readonly seed: number
  private rng: () => number
  private seq = 0
  private tickCounter = 0
  events: LedgerEvent[] = []
  private pendingInfections: PendingInjection[] = []

  constructor(seed = 42) {
    this.seed = seed
    this.rng = mulberry32(seed)
  }

  /**
   * Advance one tick. Generates one deterministic event and processes any
   * pending injections that should be flagged by the compliance-sentinel.
   * Returns all entries emitted this tick (typically 1-2 events).
   */
  tick(): LedgerEvent[] {
    const emitted: LedgerEvent[] = []

    // Generate next deterministic event from the RNG stream.
    const evt = generateEvent(this.rng, this.seq++)
    emitted.push(evt)
    this.events.push(evt)

    // Process pending injections: compliance-sentinel flags stale facts
    // deterministically within 1-3 ticks based on injection seq.
    for (let i = this.pendingInfections.length - 1; i >= 0; i--) {
      const pending = this.pendingInfections[i]
      const ticksSinceInjection = this.tickCounter - pending.injectedAtSeq
      // Use deterministic delay: (seq % 3) + 1 maps to 1, 2, or 3 ticks.
      const flagAtTick = (pending.injectedAtSeq % 3) + 1
      if (ticksSinceInjection === flagAtTick) {
        // Flip verdict to stale and emit a sentinel flag event.
        pending.event.verdict = 'stale'
        pending.event.value = buildValue(
          pending.event.kind,
          pending.event.subject,
          'stale',
        )

        // Emit a decision event from the compliance-sentinel.
        const flagEvent: LedgerEvent = {
          id: `lg-${String(this.seq).padStart(4, '0')}-flagd`,
          kind: 'decision',
          subject: pending.event.subject,
          value: `compliance-sentinel flags ${pending.event.subject} as stale`,
          provenance: 'tool',
          verdict: 'current',
          actor: 'compliance-sentinel',
          seq: this.seq++,
        }
        emitted.push(flagEvent)
        this.events.push(flagEvent)
        this.pendingInfections.splice(i, 1)
      }
    }

    this.tickCounter++
    return emitted
  }

  /** Append the next deterministic event. Backward compat for step(). */
  step(): LedgerEvent {
    const emitted = this.tick()
    // Return the first generated event (not sentinel flags).
    return emitted[0]
  }

  /**
   * Scripted append for interactive demos — does not consume the RNG stream.
   * Used by scenarios.ts to demonstrate agent capabilities without affecting
   * runSim() determinism.
   */
  appendScripted(
    partial: Pick<LedgerEvent, 'kind' | 'actor' | 'subject' | 'provenance'> & {
      value?: string
      verdict?: Verdict
    },
  ): LedgerEvent {
    const verdict = partial.verdict ?? 'current'
    const value =
      partial.value ?? buildValue(partial.kind, partial.subject, verdict)
    const evt: LedgerEvent = {
      id: `lg-${String(this.seq).padStart(4, '0')}-script`,
      kind: partial.kind,
      subject: partial.subject,
      value,
      provenance: partial.provenance,
      verdict,
      actor: partial.actor,
      seq: this.seq++,
    }
    this.events.push(evt)
    return evt
  }

  /**
   * Visitor action: inject a stale, unverifiable copy of a subject the ledger
   * already holds. The compliance-sentinel will flag it within 1-3 ticks.
   * If subject is not provided, uses the most recent subject from the ledger.
   */
  injectStaleFact(subject?: string): LedgerEvent {
    const targetSubject = subject || this.getRecentSubject()
    const evt: LedgerEvent = {
      id: `lg-${String(this.seq).padStart(4, '0')}-injctd`,
      kind: 'claim',
      subject: targetSubject,
      value: `asserts ${targetSubject} → (unverified external copy)`,
      provenance: 'retrieval',
      verdict: 'unverifiable',
      actor: 'external-portal',
      seq: this.seq++,
    }
    this.events.push(evt)
    this.pendingInfections.push({
      event: evt,
      injectedAtSeq: this.tickCounter,
    })
    return evt
  }

  /**
   * Backward-compatible alias for injectStaleFact. Kept for existing code.
   */
  injectStale(subject: string): LedgerEvent {
    return this.injectStaleFact(subject)
  }

  /**
   * Visitor action: inject a suspicious instruction-like write that will be
   * immediately (or within 1 tick) quarantined by the compliance-sentinel.
   * Quarantined entries are excluded from metrics().
   * If subject is not provided, uses the most recent subject from the ledger.
   */
  injectSuspiciousWrite(subject?: string): LedgerEvent {
    const targetSubject = subject || this.getRecentSubject()
    const evt: LedgerEvent = {
      id: `lg-${String(this.seq).padStart(4, '0')}-suspicious`,
      kind: 'claim',
      subject: targetSubject,
      value: `(suspicious instruction-like write to ${targetSubject})`,
      provenance: 'tool',
      verdict: 'quarantined',
      actor: 'external-portal',
      seq: this.seq++,
    }
    this.events.push(evt)
    return evt
  }

  /**
   * Site-success metrics computed from verified (non-quarantined) entries.
   * Activations are decision-kind events; queries are claims; verified share
   * is the percentage of entries with 'current' verdict.
   * Quarantined entries are excluded entirely from these calculations.
   */
  metrics(): SiteSuccessMetrics {
    const nonQuarantined = this.events.filter(
      (e) => e.verdict !== 'quarantined',
    )
    const activationDays = nonQuarantined.filter(
      (e) => e.kind === 'decision',
    ).length
    const totalClaims = nonQuarantined.filter(
      (e) => e.kind === 'claim',
    ).length
    const queryRatePct =
      totalClaims > 0 ? (activationDays / totalClaims) * 100 : 0
    const verifiedCount = nonQuarantined.filter(
      (e) => e.verdict === 'current',
    ).length
    const verifiedSharePct =
      nonQuarantined.length > 0
        ? (verifiedCount / nonQuarantined.length) * 100
        : 0
    const quarantinedExcluded = this.events.filter(
      (e) => e.verdict === 'quarantined',
    ).length

    return {
      activationDays,
      queryRatePct,
      verifiedSharePct,
      quarantinedExcluded,
    }
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
    this.tickCounter = 0
    this.events = []
    this.pendingInfections = []
  }

  /** Helper: get the most recent subject from the ledger, or a default. */
  private getRecentSubject(): string {
    if (this.events.length > 0) {
      return this.events[this.events.length - 1].subject
    }
    return SUBJECTS[0]
  }
}
