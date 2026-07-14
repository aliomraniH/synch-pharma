import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'

/**
 * ACT 2 — THE PROBLEM: portal sprawl resolves into one governed spine.
 *
 * Onboarding a portal fans out drifting copies of the same fact (each stale);
 * "collapse to one spine" snaps to a single governed record — logins → 1,
 * versions-of-each-fact → 1 — while the systems-of-record row stays unchanged
 * (still swappable). The reconcile pill flips "no one can reconcile" → "one
 * spine reconciles", mirroring the ledger's stale → current signal. Once
 * governed, the add button swaps in another system WITHOUT re-fragmenting.
 *
 * All motion is CSS transition only, gated by the global prefers-reduced-motion
 * backstop in tokens.css — the state still changes when motion is reduced.
 */
const problem: Act = {
  id: 'problem',
  title: COPY.problem.headline,
  mount(el: HTMLElement, _ctx: ActContext): void {
    const cfg = COPY.problem.flip
    const c = cfg.counters
    let systems: number = cfg.initialSystems
    let governed = false

    el.innerHTML = `
      <p class="eyebrow">${COPY.problem.eyebrow}</p>
      <h2>${COPY.problem.headline}</h2>
      <p class="lede">${COPY.problem.subhead}</p>
      <p class="lede">${COPY.problem.body}</p>
      <p class="lede">${COPY.problem.bodySecondary}</p>
      <div class="portal-stage" data-portal-stage>
        <div class="portal-stage-head">
          <div class="portal-count mono" data-truth-num>${cfg.truthLayerNum}</div>
          <div class="portal-count-lbl">${cfg.truthLayerLabel}</div>
          <div class="portal-btns">
            <button type="button" class="btn" data-add>${cfg.addLabel}</button>
            <button type="button" class="btn primary" data-collapse>${cfg.collapseLabel}</button>
          </div>
        </div>
        <div class="portal-stack">
          <div class="portal-copies" data-copies aria-hidden="true"></div>
          <div class="portal-systems" data-systems aria-hidden="true"></div>
          <div class="portal-rail" aria-hidden="true"></div>
        </div>
        <div class="portal-counters">
          <div class="portal-cell">
            <div class="portal-k">${c.loginsLabel}</div>
            <div class="portal-v mono" data-m-logins>0</div>
            <div class="portal-sub" data-s-logins></div>
          </div>
          <div class="portal-cell">
            <div class="portal-k">${c.copiesLabel}</div>
            <div class="portal-v mono" data-m-copies>0</div>
            <div class="portal-sub" data-s-copies></div>
          </div>
          <div class="portal-cell">
            <div class="portal-k">${c.systemsLabel}</div>
            <div class="portal-v portal-v-sys mono" data-m-systems>0</div>
            <div class="portal-sub">${c.systemsSub}</div>
          </div>
          <div class="portal-cell">
            <div class="portal-k">${c.reconLabel}</div>
            <div class="portal-recon-wrap"><span class="portal-pill" data-m-recon></span></div>
            <div class="portal-sub" data-s-recon></div>
          </div>
        </div>
      </div>
      <p class="portal-payoff" data-payoff aria-live="polite"></p>
      <div class="portal-reset-row">
        <button type="button" class="btn ghost portal-reset" data-reset hidden>${cfg.resetLabel}</button>
      </div>
      <p style="color: var(--muted); margin-top: var(--space-5);">${COPY.problem.transition}</p>
    `

    const q = <T extends HTMLElement>(sel: string): T =>
      el.querySelector<T>(sel)!
    const copiesEl = q('[data-copies]')
    const systemsEl = q('[data-systems]')
    const addBtn = q<HTMLButtonElement>('[data-add]')
    const collapseBtn = q<HTMLButtonElement>('[data-collapse]')
    const resetBtn = q<HTMLButtonElement>('[data-reset]')

    const render = (): void => {
      const logins = governed ? 1 : systems
      const copiesN = governed ? 1 : systems

      q('[data-m-logins]').textContent = String(logins)
      q('[data-m-copies]').textContent = String(copiesN)
      q('[data-m-systems]').textContent = String(systems)
      q('[data-m-logins]').className = `portal-v mono ${governed ? 'good' : 'bad'}`
      q('[data-m-copies]').className = `portal-v mono ${governed ? 'good' : 'bad'}`
      q('[data-s-logins]').textContent = governed
        ? c.loginsGoverned
        : c.loginsFragmented
      q('[data-s-copies]').textContent = governed
        ? c.copiesGoverned
        : c.copiesFragmented

      const recon = q('[data-m-recon]')
      recon.textContent = governed ? c.reconGoverned : c.reconFragmented
      recon.className = `portal-pill ${governed ? 'good' : 'bad'}`
      q('[data-s-recon]').textContent = governed
        ? c.reconSubGoverned
        : c.reconSubFragmented

      // Systems of record — unchanged by governance, always shown.
      systemsEl.innerHTML = ''
      for (let i = 0; i < systems; i++) {
        const chip = document.createElement('span')
        chip.className = 'portal-syschip mono'
        chip.textContent = cfg.systemChips[i % cfg.systemChips.length]
        systemsEl.appendChild(chip)
      }

      // The fact: fanned-out drifting copies (fragmented) or one governed record.
      copiesEl.innerHTML = ''
      if (!governed) {
        for (let j = 0; j < systems; j++) {
          const card = document.createElement('div')
          card.className = 'portal-copy-card'
          const offset = j - (systems - 1) / 2
          card.style.transform = `translateX(${offset * 30}px) translateY(${
            -Math.abs(offset) * 4
          }px) rotate(${offset * 2}deg)`
          card.style.zIndex = String(20 - Math.abs(Math.round(offset)))
          const label = cfg.factNames[j % cfg.factNames.length]
          const stale =
            j > 0
              ? `<span class="portal-dot" aria-hidden="true"></span>stale · v${j}`
              : `<span class="portal-dot" aria-hidden="true"></span>which one is true?`
          card.innerHTML = `<div class="portal-ct mono">${label}</div><div class="portal-cv">copy #${
            j + 1
          }</div><div class="portal-cstale mono">${stale}</div>`
          copiesEl.appendChild(card)
        }
      } else {
        const spine = document.createElement('div')
        spine.className = 'portal-copy-card portal-spine'
        spine.innerHTML = `<div class="portal-ct mono">governed record · one spine</div><div class="portal-cv">the fact, versioned once</div><div class="portal-cstale mono"><span class="portal-dot" aria-hidden="true"></span>current · reconciled against source</div>`
        copiesEl.appendChild(spine)
      }

      q('[data-payoff]').textContent = governed
        ? cfg.payoffGoverned
        : cfg.payoffFragmented

      q('[data-portal-stage]').classList.toggle('governed', governed)
      addBtn.disabled = systems >= cfg.maxSystems
      addBtn.textContent = governed ? cfg.addLabelGoverned : cfg.addLabel
      collapseBtn.hidden = governed
      resetBtn.hidden = !governed
    }

    // Onboarding a portal (or, once governed, swapping in another system of
    // record) adds a system — but governance keeps copies and logins at 1.
    addBtn.addEventListener('click', () => {
      if (systems < cfg.maxSystems) systems++
      render()
    })
    collapseBtn.addEventListener('click', () => {
      governed = true
      render()
    })
    resetBtn.addEventListener('click', () => {
      governed = false
      systems = cfg.initialSystems
      render()
    })

    render()
  },
}

export default problem
