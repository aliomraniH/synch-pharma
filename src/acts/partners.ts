import type { Act, ActContext } from './act'

/** ACT 4 — HOW PARTNERS PLUG IN: keep your own systems; we govern the atoms. */
const partners: Act = {
  id: 'partners',
  title: 'How partners plug in',
  mount(el: HTMLElement, _ctx: ActContext): void {
    const standards = [
      { name: 'USDM', note: 'unified study data model' },
      { name: 'FHIR', note: 'subject & clinical resources' },
      { name: 'CDASH', note: 'data collection standard' },
      { name: 'DIA eISF', note: 'electronic investigator site file' },
      { name: 'ICH M11', note: 'structured protocol' },
    ]
    el.innerHTML = `
      <p class="eyebrow">How partners plug in</p>
      <h2>Keep your eISF and CTMS. We govern the atoms.</h2>
      <p class="lede">
        Sites keep their own systems. SynchPharma governs the data atoms,
        integrity guardrails, and outcomes — on vendor-independent standards.
      </p>
      <div class="std-row">
        ${standards
          .map(
            (s) => `
          <div class="std-card">
            <div class="std-name mono">${s.name}</div>
            <div class="std-note">${s.note}</div>
          </div>`,
          )
          .join('')}
      </div>
    `
  },
}

export default partners
