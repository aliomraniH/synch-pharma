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
    /**
     * Interactive portal→spine state flip (Change 1). Onboarding a portal fans
     * out drifting copies of the same fact; collapsing to one spine governs the
     * data — logins and copies drop to 1 while the systems of record stay
     * swappable underneath. Mirrors the ledger's stale → current signal.
     */
    flip: {
      initialSystems: 4,
      maxSystems: 8,
      truthLayerNum: '1',
      truthLayerLabel:
        'truth layer a site needs, no matter how many portals arrive',
      addLabel: '+ onboard another portal',
      addLabelGoverned: '+ swap in another system',
      collapseLabel: 'collapse to one spine',
      resetLabel: 're-fragment ↺',
      /** Systems of record — kept swappable; count is unchanged by governance. */
      systemChips: [
        'Veeva',
        'legacy SIP',
        'EDC',
        'CTMS',
        'eISF',
        'safety',
        'payments',
        'IRB',
      ],
      /** The single fact that drifts into stale copies when fragmented. */
      factNames: [
        'site status',
        'IRB approval',
        'enrollment count',
        'safety letter ack',
        'budget version',
        'protocol amend.',
      ],
      counters: {
        loginsLabel: 'Portals a site opens',
        loginsFragmented: 'one login each',
        loginsGoverned: 'one credential, every trial',
        copiesLabel: 'Versions of each fact',
        copiesFragmented: 'copies drift out of sync',
        copiesGoverned: 'one governed record',
        systemsLabel: 'Systems of record',
        systemsSub: 'unchanged — kept swappable',
        reconLabel: 'Reconcilable?',
        reconFragmented: 'no one can reconcile',
        reconGoverned: 'one spine reconciles',
        reconSubFragmented: 'truth splinters across screens',
        reconSubGoverned:
          'reconcile flips stale → current before anyone acts',
      },
      payoffFragmented:
        'Onboarding a portal adds a destination, not a truth layer. The fix is not a better portal — collapse to one spine to see what actually changes.',
      payoffGoverned:
        "The systems of record didn't leave — they're still swappable. What collapsed is the copies. Govern the data, not the workflow.",
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
    /**
     * Site Success cited baselines (Change 2). Each card keeps its LIVE,
     * engine-computed value as the moving number; these are static, sourced
     * industry anchors placed around them so the number that moves is ours and
     * the number it is judged against is real. The deterministic engine and its
     * computed values are untouched — this is caption text only.
     */
    siteSuccess: {
      activationDays: {
        delta: '167 d → 90 d',
        sub: 'industry median → NCI target',
        src: 'AACI 2018 · WCG · NCI',
      },
      queryRate: {
        delta: '20–40% → −82%',
        sub: 'per-CRF (≤1% true error) → single-source',
        src: 'IntuitionLabs · Curebase',
      },
      verifiedShare: {
        delta: '976/10k → 14/10k',
        sub: 'errors per 10,000 fields, paper → structured',
        src: 'NIDA CTN',
      },
      quarantinedExcluded: {
        integrity:
          'Writes whose provenance failed, held out of the score. A fragmented estate has no gate — stale and duplicate copies count as truth and every number above inflates. Excluding them is what makes the rest real.',
        src: 'computed from verified entries only',
      },
      loginsLine:
        "One cost the cards can't hold: a site logs into 6+ systems per study — 20–22 across a full trial — and only 32% can use their own credentials. One spine collapses that to one login.",
      loginsSrc: 'Advarra 2023 · SCRS "Cut 25" · Applied Clinical Trials',
      /** Visible sources block — the four cited source labels. */
      sources: [
        'Activation days — AACI 2018 · WCG · JCTS 2023 (standard templates save ~48 d)',
        'Query rate — IntuitionLabs · Curebase (~82% fewer queries; ~67% lower data-mgmt cost/patient)',
        'Verified share — NIDA CTN (PMC): 14.3 vs ~976 errors / 10,000 fields',
        'Logins per study — Advarra 2023 · SCRS "Cut 25" · Applied Clinical Trials',
      ],
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
