import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'
import {
  LedgerSimulation,
  SUBJECTS,
  type LedgerEvent,
  type LedgerKind,
} from '../sim/engine'
import {
  DEMO_RUNNERS,
  type AgentStatus,
} from '../sim/scenarios'

/** Agent metadata — role lines are asserted by scripts/validate.mjs in built HTML. */
const AGENTS = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    role: 'routes work, owns the ledger view',
    accent: 'indigo',
    capabilities: [
      'Routes work items to the right agent role',
      'Owns the ledger view and write sequencing',
      'Coordinates multi-agent flows across the spine',
    ],
  },
  {
    id: 'data-steward',
    name: 'Data Steward',
    role: 'writes claims with provenance; rejects unverifiable facts',
    accent: 'teal',
    capabilities: [
      'Appends claims with tool or retrieval provenance',
      'Rejects facts that cannot be verified',
      'Preserves subject lineage for reconciliation',
    ],
  },
  {
    id: 'partner-liaison',
    name: 'Partner Liaison',
    role: 'handoffs to and from site & vendor systems',
    accent: 'teal',
    capabilities: [
      'Emits handoff entries to site systems',
      'Receives vendor updates into the ledger',
      'Bridges external portals without new logins',
    ],
  },
  {
    id: 'compliance-sentinel',
    name: 'Compliance Sentinel',
    role: 'reconciles, flags stale/colliding, quarantines',
    accent: 'amber',
    capabilities: [
      'Reconciles newest claim per subject',
      'Flags stale and colliding entries',
      'Quarantines instruction-shaped writes',
    ],
  },
  {
    id: 'site-success',
    name: 'Site Success',
    role: 'reads only verified state; computes sponsor-of-choice metrics',
    accent: 'green',
    capabilities: [
      'Reads only verified, non-quarantined entries',
      'Computes activation and query-rate metrics',
      'Excludes quarantined rows from sponsor KPIs',
    ],
  },
] as const

type AgentId = (typeof AGENTS)[number]['id']

const KIND_EDGE_COLOR: Record<LedgerKind, string> = {
  claim: 'var(--teal)',
  decision: 'var(--indigo)',
  knowledge: 'var(--green)',
  handoff: 'var(--teal)',
}

/** 16x16 stroke icons, tinted by each card's accent via currentColor. */
const ICONS: Record<string, string> = {
  orchestrator:
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="3.5" cy="8" r="1.8"/><circle cx="12.5" cy="3.5" r="1.8"/><circle cx="12.5" cy="12.5" r="1.8"/><path d="M5.2 7.2l5.6-2.9M5.2 8.8l5.6 2.9"/></svg>',
  'data-steward':
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 13.5l.9-3.4 7.3-7.3 2.5 2.5-7.3 7.3-3.4.9z"/><path d="M9.2 4.3l2.5 2.5"/></svg>',
  'partner-liaison':
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5h9m0 0L10 2.5M12.5 5L10 7.5"/><path d="M12.5 11h-9m0 0L6 8.5M3.5 11L6 13.5"/></svg>',
  'compliance-sentinel':
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.5V1.5"/><path d="M4 2.5h8.5L10 5.5l2.5 3H4"/></svg>',
  'site-success':
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 13.5V9.5M6 13.5V5.5M9.5 13.5V7.5M13 13.5V3.5"/></svg>',
}

const spine: Act = {
  id: 'spine',
  title: COPY.spine.headline,
  mount(el: HTMLElement, ctx: ActContext): void {
    const sim = new LedgerSimulation(42)
    const agentCounts = new Map<AgentId, number>(
      AGENTS.map((a) => [a.id, 0]),
    )
    const agentStatus = new Map<AgentId, AgentStatus>(
      AGENTS.map((a) => [a.id, 'idle' as AgentStatus]),
    )
    let selectedAgent: AgentId | null = null
    let demoRunning = false
    const filters = { actor: '', kind: '', verdict: '' }
    const verdictHistory = new Map<number, string[]>()

    el.innerHTML = `
      <p class="eyebrow">${COPY.spine.eyebrow}</p>
      <h2>${COPY.spine.headline}</h2>
      <p class="lede">${COPY.spine.subhead}</p>
      <p class="lede">${COPY.spine.body}</p>
      <div class="spine-stage" data-stage>
        <div class="spine-scene" data-scene>
          <svg class="spine-edges" viewBox="0 0 600 280" preserveAspectRatio="none" aria-hidden="true" data-edges></svg>
          <div class="spine-hub" data-hub tabindex="0">
            <span class="spine-hub-glyph">⬡</span>
            <span class="spine-hub-label">Spine</span>
            <span class="mono spine-hub-count" data-spine-count>0 entries</span>
            <span class="mono spine-hub-verified" data-spine-verified>—</span>
            <svg class="spine-hub-ring" viewBox="0 0 36 36" aria-hidden="true">
              <circle class="spine-ring-bg" cx="18" cy="18" r="15" />
              <circle class="spine-ring-fill" cx="18" cy="18" r="15" data-spine-ring />
            </svg>
          </div>
          ${AGENTS.map(
            (a, i) => `
            <button type="button" class="agent-card accent-${a.accent}"
              data-agent="${a.id}" data-agent-idx="${i}"
              aria-pressed="false" aria-label="${a.name}: ${a.role}">
              <span class="agent-glyph" aria-hidden="true">${ICONS[a.id]}</span>
              <span class="agent-name">${a.name}</span>
              <span class="agent-role">${a.role}</span>
              <span class="agent-status-chip" data-status-for="${a.id}">idle</span>
              <span class="agent-event-count mono" data-count-for="${a.id}">0 events</span>
            </button>`,
          ).join('')}
        </div>
        <aside class="spotlight-panel" data-spotlight hidden>
          <button type="button" class="spotlight-close" data-close-spotlight aria-label="Close spotlight">×</button>
          <h3 class="spotlight-title" data-spotlight-title></h3>
          <ul class="spotlight-caps" data-spotlight-caps></ul>
          <div class="spotlight-ledger">
            <p class="spotlight-ledger-label">Last 5 entries</p>
            <div data-spotlight-entries></div>
          </div>
          <button type="button" class="btn primary" data-demo-capability>demo this capability</button>
        </aside>
      </div>
      <div class="spine-legend" data-legend>
        <span class="legend-item"><span class="legend-swatch swatch-claim" aria-hidden="true"></span>claims</span>
        <span class="legend-item"><span class="legend-swatch swatch-decision" aria-hidden="true"></span>decisions</span>
        <span class="legend-item"><span class="legend-swatch swatch-knowledge" aria-hidden="true"></span>knowledge</span>
        <span class="legend-item"><span class="legend-swatch swatch-handoff" aria-hidden="true"></span>handoffs</span>
        <span class="legend-item"><span class="legend-swatch swatch-flag" aria-hidden="true"></span>flags / quarantine</span>
      </div>
      <p class="demo-ticker mono" data-ticker aria-live="polite" hidden></p>
      <p class="lede spine-prompt">${COPY.spine.prompt}</p>
      <div class="spine-controls">
        <button class="btn" data-step>${COPY.spine.controls.append}</button>
        <button class="btn" data-inject>${COPY.spine.controls.injectStale}</button>
        <button class="btn" data-inject-suspicious>${COPY.spine.controls.injectSuspicious}</button>
        <button class="btn" data-reconcile>${COPY.spine.controls.reconcile}</button>
        <button class="btn ghost" data-reset>${COPY.spine.controls.reset}</button>
      </div>
      <div class="ledger-filters" data-filters>
        <div class="fchip-group" role="group" aria-label="Filter by agent" data-fgroup="actor">
          <button type="button" class="fchip" data-fvalue="" aria-pressed="true">all agents</button>
          ${[...AGENTS.map((a) => a.id), 'external-portal']
            .map(
              (id) =>
                `<button type="button" class="fchip mono" data-fvalue="${id}" aria-pressed="false">${id}</button>`,
            )
            .join('')}
        </div>
        <div class="fchip-group" role="group" aria-label="Filter by kind" data-fgroup="kind">
          <button type="button" class="fchip" data-fvalue="" aria-pressed="true">all kinds</button>
          ${['claim', 'knowledge', 'decision', 'handoff']
            .map(
              (k) =>
                `<button type="button" class="fchip mono fchip-kind-${k}" data-fvalue="${k}" aria-pressed="false">${k}</button>`,
            )
            .join('')}
        </div>
        <div class="fchip-group" role="group" aria-label="Filter by verdict" data-fgroup="verdict">
          <button type="button" class="fchip" data-fvalue="" aria-pressed="true">all verdicts</button>
          ${['current', 'stale', 'unverifiable', 'quarantined']
            .map(
              (v) =>
                `<button type="button" class="fchip mono fchip-verdict-${v}" data-fvalue="${v}" aria-pressed="false">${v}</button>`,
            )
            .join('')}
        </div>
      </div>
      <div class="ledger" role="log" aria-live="polite" aria-label="Coordination ledger" data-ledger></div>
      <div class="stat-cards" data-stat-cards aria-label="Site Success metrics">
        <p class="stat-cards-owner">Site Success · computed from verified entries only</p>
        <div class="stat-cards-grid">
          <div class="stat-card accent-green" data-stat="activation">
            <span class="stat-label">activation days</span>
            <span class="stat-value mono" data-metric-activation>—</span>
            <span class="stat-spark" data-spark-activation aria-hidden="true"></span>
          </div>
          <div class="stat-card accent-green" data-stat="query">
            <span class="stat-label">query rate</span>
            <span class="stat-value mono" data-metric-query>—</span>
            <span class="stat-spark" data-spark-query aria-hidden="true"></span>
          </div>
          <div class="stat-card accent-green" data-stat="verified">
            <span class="stat-label">verified share</span>
            <span class="stat-value mono" data-metric-verified>—</span>
            <span class="stat-spark" data-spark-verified aria-hidden="true"></span>
          </div>
          <div class="stat-card accent-green" data-stat="quarantined">
            <span class="stat-label">quarantined excluded</span>
            <span class="stat-value mono" data-metric-quarantined>—</span>
            <span class="stat-spark" data-spark-quarantined aria-hidden="true"></span>
          </div>
        </div>
      </div>
      <div class="provenance-popover" data-provenance hidden role="dialog" aria-label="Entry provenance"></div>
      <p class="spine-transition">${COPY.spine.transition}</p>
    `

    const ledgerEl = el.querySelector<HTMLElement>('[data-ledger]')!
    const sceneEl = el.querySelector<HTMLElement>('[data-scene]')!
    const stageEl = el.querySelector<HTMLElement>('[data-stage]')!
    const spotlightEl = el.querySelector<HTMLElement>('[data-spotlight]')!
    const edgesSvg = el.querySelector<SVGElement>('[data-edges]')!
    const provenanceEl = el.querySelector<HTMLElement>('[data-provenance]')!
    const prevMetrics = {
      activationDays: 0,
      queryRatePct: 0,
      verifiedSharePct: 0,
      quarantinedExcluded: 0,
    }
    const sparkHistory = {
      activation: [] as number[],
      query: [] as number[],
      verified: [] as number[],
      quarantined: [] as number[],
    }
    const statusTimers = new Map<string, ReturnType<typeof setTimeout>>()

    // viewBox is 600x280 mapped with preserveAspectRatio="none", so
    // x/600 and y/280 are percentages of the scene box. Anchors sit inside
    // each card's rectangle; the hub center matches .spine-hub's CSS top.
    const agentPositions = [
      { x: 72, y: 56 },
      { x: 528, y: 56 },
      { x: 528, y: 224 },
      { x: 72, y: 224 },
      { x: 300, y: 238 },
    ]
    const hubPos = { x: 300, y: 106 }

    /** Gentle quadratic curve agent → hub; pulses ride the same path so they
     *  never overshoot the nodes. Bow is perpendicular to the chord. */
    const edgePath = (from: { x: number; y: number }, to: { x: number; y: number }): string => {
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2
      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy) || 1
      const bow = Math.min(15, len * 0.1)
      const cx = mx - (dy / len) * bow
      const cy = my + (dx / len) * bow
      return `M ${from.x} ${from.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x} ${to.y}`
    }
    const edgePaths = new Map<string, { toHub: string; fromHub: string }>(
      AGENTS.map((a, i) => [
        a.id,
        {
          toHub: edgePath(agentPositions[i], hubPos),
          fromHub: edgePath(hubPos, agentPositions[i]),
        },
      ]),
    )

    const drawEdges = () => {
      const idleEdges = AGENTS.map(
        (a) => `<path class="spine-edge" data-edge-for="${a.id}"
          d="${edgePaths.get(a.id)!.toHub}" />`,
      ).join('')
      edgesSvg.innerHTML = `${idleEdges}<g data-pulses></g>`
    }
    drawEdges()

    const setAgentStatus = (id: AgentId | string, status: AgentStatus) => {
      if (!AGENTS.some((a) => a.id === id)) return
      agentStatus.set(id as AgentId, status)
      const chip = el.querySelector(`[data-status-for="${id}"]`)
      if (chip) {
        chip.textContent = status
        chip.className = `agent-status-chip status-${status}`
      }
      const prev = statusTimers.get(id)
      if (prev) clearTimeout(prev)
      if (status !== 'idle' && status !== 'reconciling') {
        statusTimers.set(
          id,
          setTimeout(() => setAgentStatus(id, 'idle'), 1200),
        )
      }
    }

    const bumpAgentCount = (actor: string) => {
      const id = actor as AgentId
      if (!agentCounts.has(id)) return
      const n = (agentCounts.get(id) ?? 0) + 1
      agentCounts.set(id, n)
      const el_ = sceneEl.querySelector(`[data-count-for="${id}"]`)
      if (el_) el_.textContent = `${n} event${n === 1 ? '' : 's'}`
    }

    const inferStatus = (e: LedgerEvent): { agent: string; status: AgentStatus } => {
      if (e.actor === 'compliance-sentinel' && e.value.includes('flags')) {
        return { agent: 'compliance-sentinel', status: 'flagging' }
      }
      if (e.verdict === 'quarantined') {
        return { agent: 'compliance-sentinel', status: 'flagging' }
      }
      if (AGENTS.some((a) => a.id === e.actor)) {
        return { agent: e.actor, status: 'writing' }
      }
      return { agent: e.actor, status: 'writing' }
    }

    const pulseEdge = (
      fromAgent: string,
      kind: LedgerKind,
      isFlag = false,
      fromHub = false,
    ) => {
      const idx = AGENTS.findIndex((a) => a.id === fromAgent)
      if (idx < 0) return
      const color = isFlag ? 'var(--amber)' : KIND_EDGE_COLOR[kind]
      const pulseG = edgesSvg.querySelector('[data-pulses]')!
      const edge = edgesSvg.querySelector(`[data-edge-for="${fromAgent}"]`)
      edge?.classList.add('edge-active')

      if (ctx.prefersReducedMotion) {
        edge?.classList.remove('edge-active')
        return
      }

      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      )
      circle.setAttribute('class', `edge-pulse${kind === 'handoff' ? ' pulse-handoff' : ''}`)
      circle.setAttribute('r', '4')
      circle.setAttribute('fill', color)
      const anim = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'animateMotion',
      )
      anim.setAttribute('dur', '0.7s')
      anim.setAttribute('fill', 'freeze')
      const paths = edgePaths.get(fromAgent)!
      anim.setAttribute('path', fromHub ? paths.fromHub : paths.toHub)
      circle.appendChild(anim)
      pulseG.appendChild(circle)
      setTimeout(() => {
        circle.remove()
        edge?.classList.remove('edge-active')
      }, 750)
    }

    const rowHtml = (e: LedgerEvent, isNew = false): string => {
      const hidden =
        (filters.actor && e.actor !== filters.actor) ||
        (filters.kind && e.kind !== filters.kind) ||
        (filters.verdict && e.verdict !== filters.verdict)
      const quarantined = e.verdict === 'quarantined'
      return `
      <button type="button" class="row kind-border-${e.kind}${isNew ? ' row-new' : ''}${quarantined ? ' row-quarantined' : ''}${hidden ? ' row-hidden' : ''}"
        data-seq="${e.seq}" aria-label="Entry ${e.seq}: ${e.actor} ${e.kind}">
        ${quarantined ? '<span class="row-shield" aria-hidden="true">🛡</span>' : ''}
        <span class="mono seq">#${String(e.seq).padStart(2, '0')}</span>
        <span class="mono actor">${e.actor}</span>
        <span class="mono kind kind-${e.kind}">${e.kind}</span>
        <span class="mono subject" data-type-subject>${e.subject}</span>
        <span class="chip verdict-${e.verdict}" data-verdict-chip>${e.verdict}</span>
      </button>`
    }

    const updateSpineHub = () => {
      const count = sim.events.length
      const verified = sim.events.filter((e) => e.verdict === 'current').length
      const share = count > 0 ? verified / count : 0
      el.querySelector('[data-spine-count]')!.textContent =
        `${count} entr${count === 1 ? 'y' : 'ies'}`
      const pct = Math.round(share * 100)
      el.querySelector('[data-spine-verified]')!.textContent = `${pct}% verified`
      const hub = el.querySelector<HTMLElement>('[data-hub]')!
      hub.title = `${verified} of ${count} entries verified current — the green ring shows verified share`
      hub.setAttribute(
        'aria-label',
        `Spine ledger: ${count} entries, ${pct}% verified current`,
      )
      const ring = el.querySelector<SVGCircleElement>('[data-spine-ring]')!
      const circumference = 2 * Math.PI * 15
      ring.style.strokeDasharray = `${circumference}`
      ring.style.strokeDashoffset = `${circumference * (1 - share)}`
    }

    let tickerTimer: ReturnType<typeof setTimeout> | undefined
    const narrate = (msg: string) => {
      const ticker = el.querySelector<HTMLElement>('[data-ticker]')!
      ticker.hidden = false
      ticker.textContent = msg
      ticker.classList.remove('ticker-in')
      if (!ctx.prefersReducedMotion) {
        void ticker.offsetWidth // restart the entrance animation
        ticker.classList.add('ticker-in')
      }
      if (tickerTimer) clearTimeout(tickerTimer)
      tickerTimer = setTimeout(() => {
        ticker.hidden = true
        ticker.textContent = ''
      }, 4000)
    }

    const syncVerdictHistory = () => {
      for (const event of sim.events) {
        const history = verdictHistory.get(event.seq) ?? []
        if (history[history.length - 1] !== event.verdict) {
          verdictHistory.set(event.seq, [...history, event.verdict])
        }
      }
    }

    const animateCount = (
      node: HTMLElement,
      from: number,
      to: number,
      fmt: (n: number) => string,
    ) => {
      if (ctx.prefersReducedMotion || from === to) {
        node.textContent = fmt(to)
        return
      }
      const start = performance.now()
      const dur = 500
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / dur)
        const v = from + (to - from) * t
        node.textContent = fmt(v)
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }

    const renderSpark = (key: keyof typeof sparkHistory, el_: HTMLElement) => {
      const hist = sparkHistory[key]
      if (hist.length < 2) {
        el_.innerHTML = ''
        return
      }
      const max = Math.max(...hist, 1)
      const bars = hist
        .slice(-8)
        .map((v) => {
          const h = Math.round((v / max) * 12) + 2
          return `<span style="height:${h}px"></span>`
        })
        .join('')
      el_.innerHTML = bars
    }

    const updateMetrics = (pulse = false) => {
      const m = sim.metrics()
      const actEl = el.querySelector('[data-metric-activation]')!
      const qEl = el.querySelector('[data-metric-query]')!
      const vEl = el.querySelector('[data-metric-verified]')!
      const quEl = el.querySelector('[data-metric-quarantined]')!

      animateCount(actEl as HTMLElement, prevMetrics.activationDays, m.activationDays, (n) =>
        String(Math.round(n)),
      )
      animateCount(qEl as HTMLElement, prevMetrics.queryRatePct, m.queryRatePct, (n) =>
        `${n.toFixed(1)}%`,
      )
      animateCount(vEl as HTMLElement, prevMetrics.verifiedSharePct, m.verifiedSharePct, (n) =>
        `${n.toFixed(1)}%`,
      )
      animateCount(
        quEl as HTMLElement,
        prevMetrics.quarantinedExcluded,
        m.quarantinedExcluded,
        (n) => String(Math.round(n)),
      )

      sparkHistory.activation.push(m.activationDays)
      sparkHistory.query.push(m.queryRatePct)
      sparkHistory.verified.push(m.verifiedSharePct)
      sparkHistory.quarantined.push(m.quarantinedExcluded)
      renderSpark('activation', el.querySelector('[data-spark-activation]')!)
      renderSpark('query', el.querySelector('[data-spark-query]')!)
      renderSpark('verified', el.querySelector('[data-spark-verified]')!)
      renderSpark('quarantined', el.querySelector('[data-spark-quarantined]')!)

      prevMetrics.activationDays = m.activationDays
      prevMetrics.queryRatePct = m.queryRatePct
      prevMetrics.verifiedSharePct = m.verifiedSharePct
      prevMetrics.quarantinedExcluded = m.quarantinedExcluded

      if (pulse) {
        el.querySelector('[data-stat-cards]')?.classList.add('stat-pulse')
        setTimeout(
          () => el.querySelector('[data-stat-cards]')?.classList.remove('stat-pulse'),
          ctx.prefersReducedMotion ? 0 : 600,
        )
      }
    }

    const showProvenance = (e: LedgerEvent, anchor: HTMLElement) => {
      const rect = anchor.getBoundingClientRect()
      const actRect = el.getBoundingClientRect()
      const history = verdictHistory.get(e.seq) ?? [e.verdict]
      provenanceEl.hidden = false
      provenanceEl.innerHTML = `
        <button type="button" class="prov-close" data-close-prov aria-label="Close">×</button>
        <dl class="prov-dl">
          <dt>actor</dt><dd class="mono">${e.actor}</dd>
          <dt>kind</dt><dd class="mono">${e.kind}</dd>
          <dt>subject</dt><dd class="mono">${e.subject}</dd>
          <dt>seq</dt><dd class="mono">#${e.seq}</dd>
          <dt>provenance</dt><dd class="mono">${e.provenance}</dd>
          <dt>verdict</dt><dd><span class="chip verdict-${e.verdict}">${e.verdict}</span></dd>
          <dt>history</dt><dd class="mono">${history.join(' → ')}</dd>
          <dt>value</dt><dd class="mono prov-value">${e.value}</dd>
        </dl>`
      provenanceEl.style.top = `${rect.bottom - actRect.top + 8}px`
      provenanceEl.style.left = `${Math.max(0, Math.min(rect.left - actRect.left, actRect.width - 320))}px`
      provenanceEl.querySelector('[data-close-prov]')!.addEventListener('click', () => {
        provenanceEl.hidden = true
      })
    }

    const highlightProvenance = (seq: number) => {
      const row = ledgerEl.querySelector(`[data-seq="${seq}"]`)
      row?.classList.add('row-prov-highlight')
      showProvenance(
        sim.events.find((e) => e.seq === seq)!,
        row as HTMLElement,
      )
      setTimeout(() => row?.classList.remove('row-prov-highlight'), 2000)
    }

    const flagBeam = (seq: number) => {
      const row = ledgerEl.querySelector(`[data-seq="${seq}"]`)
      row?.classList.add('row-flag-beam')
      const chip = row?.querySelector('[data-verdict-chip]')
      chip?.classList.add('verdict-flip')
      row?.classList.add('row-flash')
      const rowTop = (row as HTMLElement)?.offsetTop ?? ledgerEl.scrollHeight
      ledgerEl.scrollTo({
        top: Math.max(0, rowTop - ledgerEl.clientHeight / 2),
        behavior: ctx.prefersReducedMotion ? 'auto' : 'smooth',
      })
      setTimeout(() => {
        row?.classList.remove('row-flag-beam')
        chip?.classList.remove('verdict-flip')
        row?.classList.remove('row-flash')
      }, ctx.prefersReducedMotion ? 0 : 1500)
    }

    const repaint = (newSeqs: number[] = []) => {
      syncVerdictHistory()
      const html = sim.events
        .map((e) => rowHtml(e, newSeqs.includes(e.seq)))
        .join('')
      ledgerEl.innerHTML = html
      ledgerEl.scrollTo({
        top: ledgerEl.scrollHeight,
        behavior: ctx.prefersReducedMotion ? 'auto' : 'smooth',
      })
      updateSpineHub()
      if (selectedAgent) updateSpotlight(selectedAgent)
    }

    const handleEvents = (
      events: LedgerEvent[],
      meta?: { pulseFrom?: string; pulseTo?: string },
    ) => {
      const newSeqs = events.map((e) => e.seq)
      for (const e of events) {
        bumpAgentCount(e.actor)
        const { agent, status } = inferStatus(e)
        setAgentStatus(agent, status)
        const pulseFrom = e.verdict === 'quarantined'
          ? 'compliance-sentinel'
          : meta?.pulseFrom && meta.pulseFrom === e.actor
            ? meta.pulseFrom
            : AGENTS.some((a) => a.id === e.actor)
              ? e.actor
              : null
        if (pulseFrom) {
          const isFlag =
            e.actor === 'compliance-sentinel' && e.value.includes('flags')
          pulseEdge(pulseFrom, e.kind, isFlag || e.verdict === 'quarantined')
          if (meta?.pulseTo && e.kind === 'handoff') {
            setTimeout(
              () => pulseEdge(meta.pulseTo!, e.kind, false, true),
              ctx.prefersReducedMotion ? 0 : 650,
            )
          }
        }
      }
      repaint(newSeqs)
      updateMetrics(events.length > 0)
      for (const seq of newSeqs) {
        if (!ctx.prefersReducedMotion) {
          const row = ledgerEl.querySelector(`[data-seq="${seq}"]`)
          row?.classList.add('row-flash')
          setTimeout(() => row?.classList.remove('row-flash'), 700)
        }
      }
    }

    const updateSpotlight = (id: AgentId) => {
      const agent = AGENTS.find((a) => a.id === id)!
      el.querySelector('[data-spotlight-title]')!.textContent = agent.name
      el.querySelector('[data-spotlight-caps]')!.innerHTML = agent.capabilities
        .map((c) => `<li>${c}</li>`)
        .join('')
      const entries = sim.events
        .filter((e) => e.actor === id)
        .slice(-5)
        .reverse()
      el.querySelector('[data-spotlight-entries]')!.innerHTML =
        entries.length === 0
          ? '<p class="spotlight-empty">No entries yet — run a demo or append events.</p>'
          : entries
              .map(
                (e) =>
                  `<div class="spotlight-entry mono"><span class="kind-${e.kind}">${e.kind}</span> ${e.subject} <span class="chip verdict-${e.verdict}">${e.verdict}</span></div>`,
              )
              .join('')
    }

    const openSpotlight = (id: AgentId) => {
      selectedAgent = id
      stageEl.classList.add('spotlight-open')
      spotlightEl.hidden = false
      sceneEl.querySelectorAll('.agent-card').forEach((card) => {
        const isSel = card.getAttribute('data-agent') === id
        card.classList.toggle('agent-selected', isSel)
        card.classList.toggle('agent-dimmed', !isSel)
        card.setAttribute('aria-pressed', String(isSel))
      })
      updateSpotlight(id)
    }

    const closeSpotlight = () => {
      selectedAgent = null
      stageEl.classList.remove('spotlight-open')
      spotlightEl.hidden = true
      sceneEl.querySelectorAll('.agent-card').forEach((card) => {
        card.classList.remove('agent-selected', 'agent-dimmed')
        card.setAttribute('aria-pressed', 'false')
      })
    }

    const demoCallbacks = {
      onEvents: handleEvents,
      onAgentStatus: setAgentStatus,
      onHighlightProvenance: highlightProvenance,
      onFlagBeam: flagBeam,
      onMetricsPulse: () => updateMetrics(true),
      onNarrate: narrate,
      wait: (ms: number) =>
        new Promise<void>((r) =>
          setTimeout(r, ctx.prefersReducedMotion ? 50 : ms),
        ),
    }

    // Seed initial events
    for (let i = 0; i < 6; i++) {
      const batch = sim.tick()
      for (const e of batch) bumpAgentCount(e.actor)
    }
    repaint()
    updateMetrics()

    sceneEl.querySelectorAll<HTMLButtonElement>('.agent-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-agent') as AgentId
        if (selectedAgent === id) closeSpotlight()
        else openSpotlight(id)
      })
    })

    sceneEl.addEventListener('keydown', (ev) => {
      const cards = [...sceneEl.querySelectorAll<HTMLButtonElement>('.agent-card')]
      const idx = cards.findIndex((c) => c === document.activeElement)
      if (idx < 0) return
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault()
        cards[(idx + 1) % cards.length].focus()
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault()
        cards[(idx - 1 + cards.length) % cards.length].focus()
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault()
        cards[idx].click()
      }
    })
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && selectedAgent) {
        ev.preventDefault()
        provenanceEl.hidden = true
        closeSpotlight()
      }
    })

    el.querySelector('[data-close-spotlight]')!.addEventListener('click', closeSpotlight)
    el.querySelector('[data-demo-capability]')!.addEventListener('click', async () => {
      if (!selectedAgent || demoRunning) return
      demoRunning = true
      const runner = DEMO_RUNNERS[selectedAgent]
      if (runner) await runner(sim, demoCallbacks)
      demoRunning = false
      repaint()
      updateMetrics(true)
    })

    el.querySelector('[data-step]')!.addEventListener('click', () => {
      handleEvents(sim.tick())
    })
    el.querySelector('[data-inject]')!.addEventListener('click', () => {
      const last = sim.events[sim.events.length - 1]
      const subj = last ? last.subject : SUBJECTS[0]
      handleEvents([sim.injectStaleFact(subj)], { pulseFrom: 'external-portal' })
    })
    el.querySelector('[data-inject-suspicious]')!.addEventListener('click', () => {
      const last = sim.events[sim.events.length - 1]
      const subj = last ? last.subject : SUBJECTS[0]
      handleEvents([sim.injectSuspiciousWrite(subj)], { pulseFrom: 'external-portal' })
    })
    el.querySelector('[data-reconcile]')!.addEventListener('click', () => {
      setAgentStatus('compliance-sentinel', 'reconciling')
      const before = new Map(sim.events.map((event) => [event.seq, event.verdict]))
      const flipped = sim.reconcile()
      repaint()
      updateMetrics()
      for (const event of sim.events) {
        if (before.get(event.seq) !== event.verdict) flagBeam(event.seq)
      }
      el.querySelector('.recon-note')?.remove()
      const div = document.createElement('div')
      div.className = 'recon-note mono'
      div.textContent =
        flipped > 0
          ? COPY.spine.reconcileNote
              .replace('{n}', String(flipped))
              .replace('{s}', flipped === 1 ? '' : 's')
          : COPY.spine.reconcileNoneNote
      ledgerEl.after(div)
      setTimeout(() => setAgentStatus('compliance-sentinel', 'idle'), 1200)
    })
    el.querySelector('[data-reset]')!.addEventListener('click', () => {
      sim.reset()
      verdictHistory.clear()
      agentCounts.clear()
      AGENTS.forEach((a) => agentCounts.set(a.id, 0))
      AGENTS.forEach((a) => {
        el.querySelector(`[data-count-for="${a.id}"]`)!.textContent = '0 events'
        setAgentStatus(a.id, 'idle')
      })
      for (let i = 0; i < 6; i++) sim.tick()
      for (const event of sim.events) bumpAgentCount(event.actor)
      repaint()
      updateMetrics()
      el.querySelector('.recon-note')?.remove()
      closeSpotlight()
      provenanceEl.hidden = true
    })

    el.querySelector('[data-filters]')!.addEventListener('click', (ev) => {
      const chip = (ev.target as HTMLElement).closest('.fchip') as HTMLButtonElement | null
      if (!chip) return
      const group = chip.closest('[data-fgroup]') as HTMLElement
      const key = group.getAttribute('data-fgroup') as 'actor' | 'kind' | 'verdict'
      const value = chip.getAttribute('data-fvalue') ?? ''
      // Clicking the active chip clears the filter back to "all".
      filters[key] = filters[key] === value ? '' : value
      group.querySelectorAll('.fchip').forEach((c) => {
        c.setAttribute(
          'aria-pressed',
          String((c.getAttribute('data-fvalue') ?? '') === filters[key]),
        )
      })
      provenanceEl.hidden = true // popover anchors to rows that may re-filter away
      repaint()
    })

    ledgerEl.addEventListener('click', (ev) => {
      const row = (ev.target as HTMLElement).closest('.row') as HTMLElement | null
      if (!row) return
      const seq = Number(row.getAttribute('data-seq'))
      const entry = sim.events.find((e) => e.seq === seq)
      if (entry) showProvenance(entry, row)
    })
  },
}

export default spine
