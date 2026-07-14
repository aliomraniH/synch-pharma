/*
 * Scripted micro-sequences for the Act 3 capability spotlight demos.
 * Drives the existing LedgerSimulation API — never touches runSim() RNG.
 */
import type { LedgerSimulation, LedgerEvent } from './engine'
import { SUBJECTS } from './engine'

export type AgentStatus = 'idle' | 'writing' | 'flagging' | 'reconciling'

export interface DemoCallbacks {
  onEvents: (
    events: LedgerEvent[],
    meta?: { pulseFrom?: string; pulseTo?: string },
  ) => void
  onAgentStatus: (agentId: string, status: AgentStatus) => void
  onHighlightProvenance: (seq: number) => void
  onFlagBeam: (seq: number) => void
  onMetricsPulse: () => void
  wait: (ms: number) => Promise<void>
}

async function sleep(cb: DemoCallbacks, ms: number): Promise<void> {
  await cb.wait(ms)
}

function subject(sim: LedgerSimulation): string {
  const last = sim.events[sim.events.length - 1]
  return last?.subject ?? SUBJECTS[0]
}

/** Data Steward → provenance-carrying claim; provenance popover highlights. */
export async function demoDataSteward(
  sim: LedgerSimulation,
  cb: DemoCallbacks,
): Promise<void> {
  cb.onAgentStatus('data-steward', 'writing')
  const evt = sim.appendScripted({
    kind: 'claim',
    actor: 'data-steward',
    subject: subject(sim),
    provenance: 'tool',
    value: `asserts ${subject(sim)} → current (provenance: tool)`,
  })
  cb.onEvents([evt], { pulseFrom: 'data-steward' })
  await sleep(cb, 400)
  cb.onHighlightProvenance(evt.seq)
  cb.onAgentStatus('data-steward', 'idle')
}

/** Compliance Sentinel → inject stale, reconcile; flag beam to affected row. */
export async function demoComplianceSentinel(
  sim: LedgerSimulation,
  cb: DemoCallbacks,
): Promise<void> {
  const subj = subject(sim)
  cb.onAgentStatus('compliance-sentinel', 'writing')
  const injected = sim.injectStaleFact(subj)
  cb.onEvents([injected], { pulseFrom: 'external-portal' })
  await sleep(cb, 500)
  cb.onAgentStatus('compliance-sentinel', 'flagging')
  let flagged: LedgerEvent | undefined
  for (let i = 0; i < 4 && !flagged; i++) {
    const batch = sim.tick()
    cb.onEvents(batch)
    flagged = batch.find(
      (e) => e.actor === 'compliance-sentinel' && e.value.includes('flags'),
    )
    await sleep(cb, 350)
  }
  if (flagged) cb.onFlagBeam(injected.seq)
  await sleep(cb, 400)
  cb.onAgentStatus('compliance-sentinel', 'reconciling')
  sim.reconcile()
  cb.onEvents([])
  cb.onAgentStatus('compliance-sentinel', 'idle')
}

/** Partner Liaison → handoff entry; pulse travels node→spine→node. */
export async function demoPartnerLiaison(
  sim: LedgerSimulation,
  cb: DemoCallbacks,
): Promise<void> {
  cb.onAgentStatus('partner-liaison', 'writing')
  const evt = sim.appendScripted({
    kind: 'handoff',
    actor: 'partner-liaison',
    subject: subject(sim),
    provenance: 'human',
    value: `passes ${subject(sim)} → site & vendor bridge`,
  })
  cb.onEvents([evt], {
    pulseFrom: 'partner-liaison',
    pulseTo: 'site-success',
  })
  await sleep(cb, 600)
  cb.onAgentStatus('partner-liaison', 'idle')
}

/** Site Success → metrics recompute; quarantined entry shown excluded. */
export async function demoSiteSuccess(
  sim: LedgerSimulation,
  cb: DemoCallbacks,
): Promise<void> {
  cb.onAgentStatus('site-success', 'writing')
  const suspicious = sim.injectSuspiciousWrite(subject(sim))
  cb.onEvents([suspicious], { pulseFrom: 'external-portal' })
  await sleep(cb, 400)
  cb.onAgentStatus('site-success', 'idle')
  cb.onMetricsPulse()
  await sleep(cb, 300)
  const evt = sim.appendScripted({
    kind: 'knowledge',
    actor: 'site-success',
    subject: 'sponsor/activation-metric',
    provenance: 'retrieval',
    value: 'records sponsor/activation-metric → current (verified read)',
  })
  cb.onEvents([evt], { pulseFrom: 'site-success' })
  cb.onMetricsPulse()
}

/** Orchestrator → routes one work item across two agents (two pulses, two rows). */
export async function demoOrchestrator(
  sim: LedgerSimulation,
  cb: DemoCallbacks,
): Promise<void> {
  const subj = subject(sim)
  cb.onAgentStatus('orchestrator', 'writing')
  const route = sim.appendScripted({
    kind: 'decision',
    actor: 'orchestrator',
    subject: subj,
    provenance: 'synthesized',
    value: `commits route ${subj} → partner-liaison`,
  })
  cb.onEvents([route], { pulseFrom: 'orchestrator' })
  await sleep(cb, 450)
  cb.onAgentStatus('orchestrator', 'idle')
  cb.onAgentStatus('partner-liaison', 'writing')
  const handoff = sim.appendScripted({
    kind: 'handoff',
    actor: 'partner-liaison',
    subject: subj,
    provenance: 'human',
  })
  cb.onEvents([handoff], { pulseFrom: 'partner-liaison' })
  await sleep(cb, 300)
  cb.onAgentStatus('partner-liaison', 'idle')
}

export const DEMO_RUNNERS = {
  orchestrator: demoOrchestrator,
  'data-steward': demoDataSteward,
  'partner-liaison': demoPartnerLiaison,
  'compliance-sentinel': demoComplianceSentinel,
  'site-success': demoSiteSuccess,
} as const
