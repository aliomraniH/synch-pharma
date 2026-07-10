import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'

/** ACT 4 — HOW PARTNERS PLUG IN: keep your own systems; we govern the atoms. */
const partners: Act = {
  id: 'partners',
  title: COPY.partners.headline,
  mount(el: HTMLElement, _ctx: ActContext): void {
    el.innerHTML = `
      <p class="eyebrow">${COPY.partners.eyebrow}</p>
      <h2>${COPY.partners.headline}</h2>
      <p class="lede">${COPY.partners.subhead}</p>
      <p class="lede">${COPY.partners.body}</p>
      <div class="std-row">
        ${COPY.partners.standards
          .map(
            (s) => `
          <div class="std-card">
            <div class="std-name mono">${s.name}</div>
            <div class="std-note">${s.note}</div>
          </div>`,
          )
          .join('')}
      </div>
      <p style="color: var(--muted); margin-top: var(--space-4); font-size: 0.9rem;">${COPY.partners.standardsCaption}</p>
      <p style="color: var(--muted); margin-top: var(--space-5);">${COPY.partners.transition}</p>
    `
  },
}

export default partners
