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
  title: 'The coordination spine',
  mount(el: HTMLElement, ctx: ActContext): void {
    const sim = new LedgerSimulation(42)
    el.innerHTML = `
      <p class="eyebrow">The spine · live simulation</p>
      <h2>Watch the ledger govern itself.</h2>
      <p class="lede">
        Agents append claims with provenance. Reconciliation flags anything
        stale or unverifiable. This runs on a seeded, deterministic engine — the
        same one our QA validator asserts against.
      </p>
      <div class="spine-controls">
        <button class="btn" data-step>▸ append event</button>
        <button class="btn" data-inject>⚠ inject stale fact</button>
        <button class="btn" data-reconcile>↻ reconcile</button>
        <button class="btn ghost" data-reset>reset</button>
      </div>
      <div class="ledger" role="log" aria-live="polite" aria-label="Coordination ledger"></div>
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

    // Seed a few events so the act reads as populated on first view.
    for (let i = 0; i < 6; i++) sim.step()
    repaint()

    el.querySelector('[data-step]')!.addEventListener('click', () => {
      const e = sim.step()
      repaint()
      flash(e.seq)
    })
    el.querySelector('[data-inject]')!.addEventListener('click', () => {
      // Inject a stale copy of whichever subject the ledger last touched.
      const last = sim.events[sim.events.length - 1]
      const subject = last ? last.subject : SUBJECTS[0]
      const e = sim.injectStale(subject)
      repaint()
      flash(e.seq)
    })
    el.querySelector('[data-reconcile]')!.addEventListener('click', () => {
      const flipped = sim.reconcile()
      repaint()
      el.querySelector('.recon-note')?.remove()
      const div = document.createElement('div')
      div.className = 'recon-note mono'
      div.textContent = `reconcile: ${flipped} verdict${flipped === 1 ? '' : 's'} updated`
      ledgerEl.after(div)
    })
    el.querySelector('[data-reset]')!.addEventListener('click', () => {
      sim.reset()
      for (let i = 0; i < 6; i++) sim.step()
      repaint()
      el.querySelector('.recon-note')?.remove()
    })
  },
}

export default spine
