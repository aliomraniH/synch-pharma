import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'
import { LedgerSimulation, SUBJECTS, type LedgerEvent } from '../sim/engine'

/**
 * ACT 3 — THE SPINE: the live interactive simulation.
 * Five agents append verified claims/handoffs to a shared ledger. The visitor
 * can inject a stale fact and run reconcile to watch the verdict chips flip.
 * Deterministic (seed 42) so the QA validator can assert on it.
 */
const spine: Act = {
  id: 'spine',
  title: COPY.spine.headline,
  mount(el: HTMLElement, ctx: ActContext): void {
    const sim = new LedgerSimulation(42)
    el.innerHTML = `
      <p class="eyebrow">${COPY.spine.eyebrow}</p>
      <h2>${COPY.spine.headline}</h2>
      <p class="lede">${COPY.spine.subhead}</p>
      <p class="lede">${COPY.spine.body}</p>
      <div class="agent-net" aria-hidden="true">${agentNetworkSvg(ctx)}</div>
      <p class="lede" style="font-size: 0.95rem; margin: var(--space-4) 0; color: var(--muted);">${COPY.spine.prompt}</p>
      <div class="spine-controls">
        <button class="btn" data-step>${COPY.spine.controls.append}</button>
        <button class="btn" data-inject>${COPY.spine.controls.injectStale}</button>
        <button class="btn" data-inject-suspicious>${COPY.spine.controls.injectSuspicious}</button>
        <button class="btn" data-reconcile>${COPY.spine.controls.reconcile}</button>
        <button class="btn ghost" data-reset>${COPY.spine.controls.reset}</button>
      </div>
      <div class="ledger" role="log" aria-live="polite" aria-label="Coordination ledger"></div>
      <div class="metrics-row" style="display: flex; gap: var(--space-4); margin-top: var(--space-4); font-size: 0.9rem;">
        <div><span class="mono" style="color: var(--muted);">activation days:</span> <span class="mono" data-metric-activation>—</span></div>
        <div><span class="mono" style="color: var(--muted);">query rate:</span> <span class="mono" data-metric-query>—</span></div>
        <div><span class="mono" style="color: var(--muted);">verified share:</span> <span class="mono" data-metric-verified>—</span></div>
        <div><span class="mono" style="color: var(--muted);">quarantined excluded:</span> <span class="mono" data-metric-quarantined>—</span></div>
      </div>
      <p style="color: var(--muted); margin-top: var(--space-5);">${COPY.spine.transition}</p>
    `
    const ledgerEl = el.querySelector<HTMLElement>('.ledger')!

    const rowHtml = (e: LedgerEvent): string => `
      <div class="row" data-seq="${e.seq}">
        <span class="mono seq">#${String(e.seq).padStart(2, '0')}</span>
        <span class="mono actor">${e.actor}</span>
        <span class="mono kind kind-${e.kind}">${e.kind}</span>
        <span class="mono subject">${e.subject}</span>
        <span class="chip verdict-${e.verdict}">${e.verdict}</span>
      </div>`

    const repaint = () => {
      ledgerEl.innerHTML = sim.events.map(rowHtml).join('')
      ledgerEl.scrollTop = ledgerEl.scrollHeight
    }
    const flash = (seq: number) => {
      if (ctx.prefersReducedMotion) return
      const row = ledgerEl.querySelector<HTMLElement>(`[data-seq="${seq}"]`)
      row?.animate(
        [{ background: 'rgba(14,118,126,0.18)' }, { background: 'transparent' }],
        { duration: 700 },
      )
    }
    const updateMetrics = () => {
      // Try to call metrics() if available; otherwise show placeholders
      const metricsEl = el.querySelector('.metrics-row')
      if (!metricsEl) return
      try {
        const m = (sim as any).metrics?.()
        if (m) {
          metricsEl.querySelector('[data-metric-activation]')!.textContent = String(m.activationDays ?? '—')
          metricsEl.querySelector('[data-metric-query]')!.textContent = `${m.queryRatePct ?? '—'}%`
          metricsEl.querySelector('[data-metric-verified]')!.textContent = `${m.verifiedSharePct ?? '—'}%`
          metricsEl.querySelector('[data-metric-quarantined]')!.textContent = String(m.quarantinedExcluded ?? '—')
        }
      } catch {
        // metrics() not yet available; leave placeholders
      }
    }

    // Seed a few events so the act reads as populated on first view.
    for (let i = 0; i < 6; i++) sim.step()
    repaint()
    updateMetrics()

    el.querySelector('[data-step]')!.addEventListener('click', () => {
      const e = sim.step()
      repaint()
      updateMetrics()
      flash(e.seq)
    })
    el.querySelector('[data-inject]')!.addEventListener('click', () => {
      // Inject a stale copy of whichever subject the ledger last touched.
      const last = sim.events[sim.events.length - 1]
      const subject = last ? last.subject : SUBJECTS[0]
      const e = (sim as any).injectStaleFact?.(subject) ?? (sim as any).injectStale?.(subject)
      if (e) {
        repaint()
        updateMetrics()
        flash(e.seq)
      }
    })
    el.querySelector('[data-inject-suspicious]')!.addEventListener('click', () => {
      // Try to call injectSuspiciousWrite if available
      const last = sim.events[sim.events.length - 1]
      const subject = last ? last.subject : SUBJECTS[0]
      const e = (sim as any).injectSuspiciousWrite?.(subject)
      if (e) {
        repaint()
        updateMetrics()
        flash(e.seq)
      }
    })
    el.querySelector('[data-reconcile]')!.addEventListener('click', () => {
      const flipped = sim.reconcile()
      repaint()
      updateMetrics()
      el.querySelector('.recon-note')?.remove()
      const div = document.createElement('div')
      div.className = 'recon-note mono'
      const noteText = flipped > 0
        ? COPY.spine.reconcileNote.replace('{n}', String(flipped)).replace('{s}', flipped === 1 ? '' : 's')
        : COPY.spine.reconcileNoneNote
      div.textContent = noteText
      ledgerEl.after(div)
    })
    el.querySelector('[data-reset]')!.addEventListener('click', () => {
      sim.reset()
      for (let i = 0; i < 6; i++) sim.step()
      repaint()
      updateMetrics()
      el.querySelector('.recon-note')?.remove()
    })
  },
}

function agentNetworkSvg(ctx: ActContext): string {
  const nodes = [
    { x: 90, y: 60, label: 'Orchestrator' },
    { x: 300, y: 40, label: 'Data Steward' },
    { x: 510, y: 70, label: 'Partner Liaison' },
    { x: 180, y: 170, label: 'Compliance Sentinel' },
    { x: 420, y: 175, label: 'Site Success' },
    { x: 300, y: 110, label: 'Spine' },
  ]
  const hub = nodes[5]
  const edges = nodes
    .slice(0, 5)
    .map(
      (n) =>
        `<line class="edge" x1="${hub.x}" y1="${hub.y}" x2="${n.x}" y2="${n.y}" />
         ${
           ctx.prefersReducedMotion
             ? ''
             : `<circle class="pulse" r="3" cx="${n.x}" cy="${n.y}">
                  <animateMotion dur="2.4s" repeatCount="indefinite"
                    path="M ${n.x} ${n.y} L ${hub.x} ${hub.y}" />
                </circle>`
         }`,
    )
    .join('')
  const dots = nodes
    .map(
      (n, i) =>
        `<circle class="node ${i === 5 ? 'hub' : ''}" cx="${n.x}" cy="${n.y}" r="${
          i === 5 ? 16 : 10
        }" />
         <text class="node-label" x="${n.x}" y="${n.y + (i === 5 ? 34 : 26)}"
           text-anchor="middle">${n.label}</text>`,
    )
    .join('')
  return `<svg viewBox="0 0 600 230" role="img" aria-label="Agent network converging on coordination spine">${edges}${dots}</svg>`
}

export default spine
