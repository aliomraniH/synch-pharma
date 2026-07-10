/*
 * src/content/copy.ts
 *
 * Single source of truth for SynchPharma page copy. Owned by narrative-agent.
 * frontend-agent wires these strings into the act modules; act modules must not
 * hand-author prose that lives here.
 *
 * VOICE: confident infrastructure company, not startup hype. The five acts are
 * ONE argument, not five panels — the `transition` line closing each act carries
 * the reader into the next. Anchor lines are load-bearing and must never drift:
 *   - hero:   "One truth layer. Zero new logins."
 *   - thesis: "Govern the data, not the workflow."
 *   - thesis, extended: "standardize what must be true, liberate how it gets done."
 */

export const COPY = {
  /** Brand-level strings and the argument's fixed anchor lines. */
  meta: {
    brand: 'SynchPharma',
    eyebrow: 'SynchPharma · coordination architecture',
    tagline: 'The coordination spine for clinical partners.',
  },

  /**
   * The three lines the whole page is built to defend. These are quoted exactly
   * in the brief — do not paraphrase, re-punctuate, or split them.
   */
  anchors: {
    hero: 'One truth layer. Zero new logins.',
    thesis: 'Govern the data, not the workflow.',
    thesisExtended: 'standardize what must be true, liberate how it gets done',
  },

  // ── ACT 1 — HERO ─────────────────────────────────────────────────────────
  hero: {
    id: 'hero',
    eyebrow: 'SynchPharma · coordination architecture',
    /** The anchor promise. Rendered as one headline; split across two lines. */
    headline: 'One truth layer. Zero new logins.',
    headlineLines: ['One truth layer.', 'Zero new logins.'],
    subhead: 'A shared, verifiable coordination spine for every clinical partner.',
    body:
      "We don't move your sites, CROs, labs, and regulators onto another " +
      'portal. We run a shared, verifiable coordination spine underneath the ' +
      'systems they already use — so every partner reads from the same truth ' +
      'without ever logging into ours.',
    thesis: 'Govern the data, not the workflow.',
    thesisExtended:
      'Standardize what must be true; liberate how it gets done.',
    networkCaption: 'Every partner, converging on one spine.',
    cta: {
      primary: 'See the spine work',
      secondary: 'How partners plug in',
    },
    /** Hero → Problem: name the pain the promise answers. */
    transition:
      'The promise is simple. The status quo it replaces is not.',
  },

  // ── ACT 2 — THE PROBLEM ──────────────────────────────────────────────────
  problem: {
    id: 'problem',
    eyebrow: 'The problem',
    headline: 'Every partner ships another portal.',
    subhead: 'Coordination has become a login problem.',
    body:
      'Fragmented logins. Stale copies of the truth. Each new system is one ' +
      'more password, one more export, one more version of a fact that has ' +
      'already moved on. Sites do not need another destination — they are ' +
      'drowning in destinations.',
    bodySecondary:
      'When every sponsor arrives with its own portal, the truth splinters ' +
      'across screens no one can reconcile. The cost is not just fatigue. It ' +
      'is queries, delays, and decisions made against data that expired hours ' +
      'ago.',
    /** Interactive "portal fatigue" counter framing. */
    counter: {
      initial: 6,
      max: 14,
      collapsedValue: 1,
      /** Caption while the count climbs (count > 1). */
      captionMany: 'portals a single site juggles across sponsors',
      /** Caption once collapsed to the spine (count <= 1). */
      captionOne: 'truth layer a site needs with SynchPharma',
      /** Shown when the counter tips into overload (count >= 9). */
      overloadNote: 'This is a normal week for a busy site.',
      addLabel: '+ onboard another portal',
      collapseLabel: 'collapse to one spine',
    },
    /** Problem → Spine: pivot from the pain to the mechanism. */
    transition:
      'The fix is not a better portal. It is governing the data itself.',
  },

  // ── ACT 3 — THE SPINE ────────────────────────────────────────────────────
  spine: {
    id: 'spine',
    eyebrow: 'The spine · live simulation',
    headline: 'Watch the ledger govern itself.',
    subhead: 'One shared ledger. Five agents. Provenance on every write.',
    body:
      'Agents append claims with provenance. Reconciliation flags anything ' +
      'stale, colliding, or unverifiable, and quarantines writes that look ' +
      'like instructions instead of facts. This runs on a seeded, ' +
      'deterministic engine — the same one our QA validator asserts against.',
    /** Try-it prompt shown above the controls. */
    prompt:
      'Append a few events, then inject a stale fact and reconcile — watch the ' +
      'verdict chips flip.',
    /** The five agents on the spine (mirrors the product architecture). */
    agents: [
      {
        name: 'Orchestrator',
        role: 'routes work and owns the ledger view',
      },
      {
        name: 'Data Steward',
        role: 'writes claims with provenance; rejects unverifiable facts',
      },
      {
        name: 'Partner Liaison',
        role: 'hands off to and from site and vendor systems',
      },
      {
        name: 'Compliance Sentinel',
        role: 'reconciles claims, flags stale entries, quarantines suspicious writes',
      },
      {
        name: 'Site Success',
        role: 'reads verified state, computes sponsor-of-choice metrics',
      },
    ],
    /** Control-button microcopy. Keys map to the act module's data-* hooks. */
    controls: {
      append: '▸ append event',
      injectStale: '⚠ inject stale fact',
      injectSuspicious: '⛒ inject suspicious write',
      reconcile: '↻ reconcile',
      reset: 'reset',
    },
    /** Live reconcile-result line. `{n}` is the count of verdicts updated. */
    reconcileNote: 'reconcile: {n} verdict{s} updated',
    reconcileNoneNote: 'reconcile: everything already current',
    /** Short glosses for the verdict chips, if the act surfaces a legend. */
    verdicts: {
      current: 'reconciled against live state',
      stale: 'a newer truth has superseded this',
      unverifiable: 'no provenance we can stand behind',
      quarantined: 'instruction-shaped write, held for review',
    },
    /** Spine → Partners: from the mechanism to how you actually adopt it. */
    transition:
      'You do not migrate onto the spine. Your systems plug into it.',
  },

  // ── ACT 4 — HOW PARTNERS PLUG IN ─────────────────────────────────────────
  partners: {
    id: 'partners',
    eyebrow: 'How partners plug in',
    headline: 'Keep your eISF and CTMS. We govern the atoms.',
    subhead: 'Vendor-independent by design.',
    body:
      'Sites keep their own systems. SynchPharma governs the data atoms, the ' +
      'integrity guardrails, and the outcomes — on open, vendor-independent ' +
      'standards, so nothing you already run has to be ripped out.',
    /** Standards row — order and labels are load-bearing. */
    standards: [
      { name: 'USDM', note: 'unified study data model' },
      { name: 'FHIR', note: 'subject & clinical resources' },
      { name: 'CDASH', note: 'data collection standard' },
      { name: 'DIA eISF', note: 'electronic investigator site file' },
      { name: 'ICH M11', note: 'structured protocol' },
    ],
    standardsCaption:
      'We meet your stack where it already speaks these standards.',
    /** Partners → Proof: from "how" to "why trust this pattern". */
    transition:
      'This is not a bet on new technology. It is a pattern that has already won.',
  },

  // ── ACT 5 — PROOF & CONTACT ──────────────────────────────────────────────
  proof: {
    id: 'proof',
    eyebrow: 'Proof & contact',
    headline: 'Standardized truth layers already won elsewhere.',
    subhead: 'Govern the data, and the workflow follows.',
    body:
      'Every industry that moved from portals to a shared, governed data ' +
      'layer stopped arguing about whose screen was right. Clinical research ' +
      'is next.',
    /** Precedent strip — order and labels are load-bearing. */
    precedents: [
      { name: 'ISO 20022', note: 'one financial-messaging truth layer' },
      { name: 'Open Banking', note: 'govern data access, not the app' },
      { name: 'Digital Data Flow', note: 'protocol → study, machine-readable' },
    ],
    /** Closing call to action. */
    cta: {
      heading: 'Become a sponsor of choice.',
      body:
        'Faster activation, fewer reconciliation queries, one verifiable ' +
        'source of truth across every partner.',
      buttonLabel: 'Talk to the coordination team',
      contactEmail: 'partners@synchpharma.example',
      contactSubject: 'Coordination spine',
    },
    /** The argument, restated in one breath as the reader leaves. */
    closingLine:
      'One truth layer. Zero new logins. Govern the data, not the workflow.',
  },
} as const

export type Copy = typeof COPY
