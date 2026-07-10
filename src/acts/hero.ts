import type { Act, ActContext } from './act'

/** ACT 1 — HERO: "One truth layer. Zero new logins." */
const hero: Act = {
  id: 'hero',
  title: 'One truth layer. Zero new logins.',
  mount(el: HTMLElement, ctx: ActContext): void {
    el.innerHTML = `
      <p class="eyebrow">SynchPharma · coordination architecture</p>
      <h1>One truth layer.<br />Zero new logins.</h1>
      <p class="hero-lede">
        We don't force sites, CROs, labs, and regulators onto another portal.
        We run a shared, verifiable coordination spine — govern the data, not
        the workflow.
      </p>
      <div class="hero-net" aria-hidden="true">${networkSvg(ctx)}</div>
    `
    if (!ctx.prefersReducedMotion) {
      el.querySelectorAll<SVGElement>('.pulse').forEach((node, i) => {
        node.style.animationDelay = `${i * 0.4}s`
      })
    }
  },
}

function networkSvg(ctx: ActContext): string {
  const nodes = [
    { x: 90, y: 60, label: 'Site' },
    { x: 300, y: 40, label: 'CRO' },
    { x: 510, y: 70, label: 'Lab' },
    { x: 180, y: 170, label: 'Vendor' },
    { x: 420, y: 175, label: 'Regulator' },
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
  return `<svg viewBox="0 0 600 230" role="img" aria-label="Partner network converging on one spine">${edges}${dots}</svg>`
}

export default hero
