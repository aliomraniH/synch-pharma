import './tokens.css'
import './app.css'
import type { Act, ActContext } from './acts/act'
import hero from './acts/hero'
import problem from './acts/problem'
import spine from './acts/spine'
import partners from './acts/partners'
import proof from './acts/proof'

const acts: Act[] = [hero, problem, spine, partners, proof]

const ctx: ActContext = {
  prefersReducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}

for (const act of acts) {
  const host = document.querySelector<HTMLElement>(`[data-act="${act.id}"]`)
  if (!host) {
    console.warn(`[synch-pharma] no mount host for act "${act.id}"`)
    continue
  }
  act.mount(host, ctx)
}
