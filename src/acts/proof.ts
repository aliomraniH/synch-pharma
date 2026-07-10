import type { Act, ActContext } from './act'

/** ACT 5 — PROOF & CONTACT: precedent strip + CTA. */
const proof: Act = {
  id: 'proof',
  title: 'Proof & contact',
  mount(el: HTMLElement, _ctx: ActContext): void {
    const precedents = [
      { name: 'ISO 20022', note: 'one financial-messaging truth layer' },
      { name: 'Open Banking', note: 'govern data access, not the app' },
      { name: 'Digital Data Flow', note: 'protocol → study, machine-readable' },
    ]
    el.innerHTML = `
      <p class="eyebrow">Proof &amp; contact</p>
      <h2>Standardized truth layers already won elsewhere.</h2>
      <div class="precedent-strip">
        ${precedents
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
        <h3>Become a sponsor of choice.</h3>
        <p class="lede">
          Faster activation, fewer reconciliation queries, one verifiable source
          of truth across every partner.
        </p>
        <a class="btn primary" href="mailto:partners@synchpharma.example?subject=Coordination%20spine">
          Talk to the coordination team
        </a>
      </div>
    `
  },
}

export default proof
