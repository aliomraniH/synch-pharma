import { COPY } from '../content/copy'
import type { Act, ActContext } from './act'

/** ACT 1 — HERO: "One truth layer. Zero new logins." */
const hero: Act = {
  id: 'hero',
  title: COPY.hero.headline,
  mount(el: HTMLElement, ctx: ActContext): void {
    el.innerHTML = `
      <p class="eyebrow">${COPY.hero.eyebrow}</p>
      <h1>${COPY.hero.headlineLines[0]}<br />${COPY.hero.headlineLines[1]}</h1>
      <p class="hero-lede">${COPY.hero.subhead}</p>
      <p class="lede">${COPY.hero.body}</p>
      <div class="hero-net" aria-hidden="true">${networkSvg(ctx)}</div>
      <p style="color: var(--muted); margin-top: var(--space-5);">${COPY.hero.transition}</p>
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
  return `<svg viewBox="0 0 600 230" role="img" aria-label="Partner network converging on one spine">${edges}${dots}</svg>`
}

export default hero
