/*
 * The Act contract. Every act module MUST export a default object shaped
 * { id, title, mount(el, ctx) } — see CONVENTIONS.md. The frontend mounts
 * each act into its <section data-act="id"> host element.
 */
export interface ActContext {
  /** Honor the user's reduced-motion preference in every animation. */
  prefersReducedMotion: boolean
}

export interface Act {
  /** Canonical act id — one of: hero, problem, spine, partners, proof. */
  id: 'hero' | 'problem' | 'spine' | 'partners' | 'proof'
  title: string
  mount(el: HTMLElement, ctx: ActContext): void
}
