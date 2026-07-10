import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'

/** ACT 5 — PROOF & CONTACT: precedent strip + CTA. */
const proof: Act = {
  id: 'proof',
  title: COPY.proof.headline,
  mount(el: HTMLElement, _ctx: ActContext): void {
    const ctaSubject = encodeURIComponent(COPY.proof.cta.contactSubject)
    el.innerHTML = `
      <p class="eyebrow">${COPY.proof.eyebrow}</p>
      <h2>${COPY.proof.headline}</h2>
      <p class="lede">${COPY.proof.subhead}</p>
      <p class="lede">${COPY.proof.body}</p>
      <div class="precedent-strip">
        ${COPY.proof.precedents
          .map(
            (p) => `
          <div class="precedent">
            <div class="precedent-name mono">${p.name}</div>
            <div class="precedent-note">${p.note}</div>
          </div>`,
          )
          .join('')}
      </div>
      <div class="cta">
        <h3>${COPY.proof.cta.heading}</h3>
        <p class="lede">${COPY.proof.cta.body}</p>
        <a class="btn primary" href="mailto:${COPY.proof.cta.contactEmail}?subject=${ctaSubject}">
          ${COPY.proof.cta.buttonLabel}
        </a>
      </div>
      <p style="color: var(--muted); margin-top: var(--space-5); font-style: italic;">${COPY.proof.closingLine}</p>
    `
  },
}

export default proof
