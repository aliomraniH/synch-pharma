import type { Act, ActContext } from './act'

/** ACT 2 — THE PROBLEM: portal sprawl + an interactive "portal fatigue" counter. */
const problem: Act = {
  id: 'problem',
  title: 'Portal sprawl',
  mount(el: HTMLElement, ctx: ActContext): void {
    el.innerHTML = `
      <p class="eyebrow">The problem</p>
      <h2>Every partner ships another portal.</h2>
      <p class="lede">
        Fragmented logins. Stale copies of the truth. Each new system is one more
        password, one more export, one more version of a fact that has already
        moved on.
      </p>
      <div class="fatigue">
        <div class="fatigue-num mono" data-count>0</div>
        <div class="fatigue-cap">portals a single site juggles across sponsors</div>
        <button class="btn" data-add>+ onboard another portal</button>
        <button class="btn ghost" data-collapse>collapse to one spine</button>
      </div>
    `
    const numEl = el.querySelector<HTMLElement>('[data-count]')!
    const cap = el.querySelector<HTMLElement>('.fatigue-cap')!
    let count = 6
    const render = () => {
      numEl.textContent = String(count)
      numEl.classList.toggle('overload', count >= 9)
      cap.textContent =
        count <= 1
          ? 'truth layer a site needs with SynchPharma'
          : 'portals a single site juggles across sponsors'
    }
    render()
    el.querySelector('[data-add]')!.addEventListener('click', () => {
      count = Math.min(count + 1, 14)
      render()
      if (!ctx.prefersReducedMotion)
        numEl.animate(
          [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
          { duration: 220 },
        )
    })
    el.querySelector('[data-collapse]')!.addEventListener('click', () => {
      count = 1
      render()
    })
  },
}

export default problem
