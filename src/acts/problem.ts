import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'

/** ACT 2 — THE PROBLEM: portal sprawl + an interactive "portal fatigue" counter. */
const problem: Act = {
  id: 'problem',
  title: COPY.problem.headline,
  mount(el: HTMLElement, ctx: ActContext): void {
    const cfg = COPY.problem.counter
    el.innerHTML = `
      <p class="eyebrow">${COPY.problem.eyebrow}</p>
      <h2>${COPY.problem.headline}</h2>
      <p class="lede">${COPY.problem.subhead}</p>
      <p class="lede">${COPY.problem.body}</p>
      <p class="lede">${COPY.problem.bodySecondary}</p>
      <div class="fatigue">
        <div class="fatigue-num mono" data-count>${cfg.initial}</div>
        <div class="fatigue-cap">${cfg.captionMany}</div>
        <button class="btn" data-add>${cfg.addLabel}</button>
        <button class="btn ghost" data-collapse>${cfg.collapseLabel}</button>
      </div>
      <p style="color: var(--muted); margin-top: var(--space-5);">${COPY.problem.transition}</p>
    `
    const numEl = el.querySelector<HTMLElement>('[data-count]')!
    const cap = el.querySelector<HTMLElement>('.fatigue-cap')!
    const overloadNote = el.querySelector<HTMLElement>('.fatigue')!
    let count: number = cfg.initial
    const render = () => {
      numEl.textContent = String(count)
      numEl.classList.toggle('overload', count >= 9)
      cap.textContent =
        count <= cfg.collapsedValue
          ? cfg.captionOne
          : cfg.captionMany
      // Show overload note when count tips into overload
      if (count >= 9 && !overloadNote.querySelector('.overload-note')) {
        const note = document.createElement('p')
        note.className = 'overload-note'
        note.style.cssText = 'color: var(--alarm); font-size: 0.9rem; margin-top: var(--space-2);'
        note.textContent = cfg.overloadNote
        cap.after(note)
      } else if (count < 9) {
        overloadNote.querySelector('.overload-note')?.remove()
      }
    }
    render()
    el.querySelector('[data-add]')!.addEventListener('click', () => {
      count = Math.min(count + 1, cfg.max)
      render()
      if (!ctx.prefersReducedMotion)
        numEl.animate(
          [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
          { duration: 220 },
        )
    })
    el.querySelector('[data-collapse]')!.addEventListener('click', () => {
      count = cfg.collapsedValue
      render()
    })
  },
}

export default problem
