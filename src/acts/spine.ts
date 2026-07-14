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
    glyph: '◎',
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
    glyph: '✎',
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
    glyph: '⇄',
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
    glyph: '⚑',
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
    glyph: '◈',
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
          <svg class="spine-edges" viewBox="0 0 600 280" aria-hidden="true" data-edges></svg>
          <div class="spine-hub" data-hub>
            <span class="spine-hub-glyph">⬡</span>
            <span class="spine-hub-label">Spine</span>
            <span class="mono spine-hub-count" data-spine-count>0 entries</span>
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
              <span class="agent-glyph" aria-hidden="true">${a.glyph}</span>
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
      <p class="lede spine-prompt">${COPY.spine.prompt}</p>
      <div class="spine-controls">
        <button class="btn" data-step>${COPY.spine.controls.append}</button>
        <button class="btn" data-inject>${COPY.spine.controls.injectStale}</button>
        <button class="btn" data-inject-suspicious>${COPY.spine.controls.injectSuspicious}</button>
        <button class="btn" data-reconcile>${COPY.spine.controls.reconcile}</button>
        <button class="btn ghost" data-reset>${COPY.spine.controls.reset}</button>
      </div>
      <div class="ledger-filters" data-filters role="group" aria-label="Filter ledger">
        <span class="filter-label">filter:</span>
        <select class="filter-chip" data-filter-actor aria-label="Filter by agent">
          <option value="">all agents</option>
          ${AGENTS.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
          <option value="external-portal">external-portal</option>
        </select>
        <select class="filter-chip" data-filter-kind aria-label="Filter by kind">
          <option value="">all kinds</option>
          <option value="claim">claim</option>
          <option value="knowledge">knowledge</option>
          <option value="decision">decision</option>
          <option value="handoff">handoff</option>
        </select>
        <select class="filter-chip" data-filter-verdict aria-label="Filter by verdict">
          <option value="">all verdicts</option>
          <option value="current">current</option>
          <option value="stale">stale</option>
          <option value="unverifiable">unverifiable</option>
          <option value="quarantined">quarantined</option>
        </select>
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

    const agentPositions = [
      { x: 90, y: 50 },
      { x: 510, y: 45 },
      { x: 510, y: 195 },
      { x: 90, y: 200 },
      { x: 300, y: 230 },
    ]
    const hubPos = { x: 300, y: 115 }

    const drawEdges = () => {
      const idleEdges = AGENTS.map((a, i) => {
        const p = agentPositions[i]
        return `<line class="spine-edge" data-edge-for="${a.id}"
          x1="${p.x}" y1="${p.y}" x2="${hubPos.x}" y2="${hubPos.y}" />`
      }).join('')
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
      const p = agentPositions[idx]
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
      const start = fromHub ? hubPos : p
      const end = fromHub ? p : hubPos
      circle.setAttribute('cx', String(start.x))
      circle.setAttribute('cy', String(start.y))
      const anim = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'animateMotion',
      )
      anim.setAttribute('dur', '0.7s')
      anim.setAttribute('fill', 'freeze')
      anim.setAttribute(
        'path',
        `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      )
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
      const ring = el.querySelector<SVGCircleElement>('[data-spine-ring]')!
      const circumference = 2 * Math.PI * 15
      ring.style.strokeDasharray = `${circumference}`
      ring.style.strokeDashoffset = `${circumference * (1 - share)}`
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
      ledgerEl.scrollTop = (row as HTMLElement)?.offsetTop ?? ledgerEl.scrollHeight
      setTimeout(() => {
        row?.classList.remove('row-flag-beam')
        chip?.classList.remove('verdict-flip')
      }, ctx.prefersReducedMotion ? 0 : 1500)
    }

    const repaint = (newSeqs: number[] = []) => {
      syncVerdictHistory()
      const html = sim.events
        .map((e) => rowHtml(e, newSeqs.includes(e.seq)))
        .join('')
      ledgerEl.innerHTML = html
      ledgerEl.scrollTop = ledgerEl.scrollHeight
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

    el.querySelector('[data-filter-actor]')!.addEventListener('change', (ev) => {
      filters.actor = (ev.target as HTMLSelectElement).value
      repaint()
    })
    el.querySelector('[data-filter-kind]')!.addEventListener('change', (ev) => {
      filters.kind = (ev.target as HTMLSelectElement).value
      repaint()
    })
    el.querySelector('[data-filter-verdict]')!.addEventListener('change', (ev) => {
      filters.verdict = (ev.target as HTMLSelectElement).value
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
