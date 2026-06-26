/**
 * Discriminability Assessment — the fourth primitive (Fresco).
 *
 * Knowledge · Evidence · Decision were the three. A fourth was hiding inside the Discovery Gap:
 * DISCRIMINABILITY — whether the EXISTING evidence can tell competing explanations apart. It is
 * NOT the same as Evidence: an Evidence Set can be rich (viscosity + pH + density) yet useless for
 * discrimination if H1 and H2 predict the SAME values for all of them. Quantity of evidence ≠
 * power to discriminate.
 *
 *   Question → Observations → Evidence Set → Discriminability Assessment → Decision
 *
 * THE BOUNDARY (the stable point of the whole chain):
 *   MATRIYA does NOT determine which evidence is needed to decide between hypotheses. It only
 *   checks whether the evidence the SCIENTIST declared as discriminating actually exists.
 *
 * Therefore both the hypotheses AND their discrimination links must be HUMAN-AUTHORED. It is not
 * enough to declare H1, H2 — each must declare what distinguishes it ("H1 is distinguished by
 * failure_mode", "H2 by SEM morphology"). Only then can the system run a purely LOGICAL check —
 * "failure_mode present? SEM present?" — and state, without inference:
 *
 *   "Cannot discriminate between H1 and H2 given current evidence."  (Discriminating Evidence Gap)
 *
 * If a hypothesis has no human-authored discriminator, the system REFUSES to proceed — inferring
 * what discriminates would cross the descriptive/inference boundary. Pure / no I/O.
 *
 * Feeds the kernel: toFailSafeSignal() → { variables_distinguishable } → kernel evaluateFailSafe
 * (VARIABLES_NOT_DISTINGUISHABLE). This module is what DECIDES that flag, from declarations only.
 */

export const PRINCIPLE =
  'MATRIYA does not determine which evidence is needed to decide between hypotheses. ' +
  'It checks whether the evidence the scientist defined as discriminating actually exists.';

/**
 * Guard: every competing hypothesis must carry a non-empty human-authored `distinguished_by`.
 * Without it the system would have to INFER what discriminates — which it must not do.
 */
export function requireAuthoredLinks(hypotheses) {
  const undeclared = (hypotheses || [])
    .filter(h => !Array.isArray(h?.distinguished_by) || h.distinguished_by.length === 0)
    .map(h => h?.id);
  return { ok: undeclared.length === 0, undeclared };
}

const rankOf = (ladder, id) => {
  const d = (ladder || []).find(x => x.id === id);
  return d && Number.isFinite(d.rank) ? d.rank : Infinity; // unknown-cost discriminators sort last
};

/** Order a list of declared discriminators shallow→deep by ladder cost (ordering only — NOT a
 *  judgement of WHAT discriminates; the human already declared that). */
const byCost = (ids, ladder) => [...ids].sort((a, b) => rankOf(ladder, a) - rankOf(ladder, b));

/**
 * Assess whether the present evidence can discriminate the competing hypotheses.
 *
 * @param hypotheses  [{ id, statement?, distinguished_by:[obsId,...] }]  — human-authored
 * @param present     [obsId,...]  — observations present in the current Evidence Set
 * @param opts.ladder depth ladder (for shallowest-first ordering of any missing discriminators)
 * @returns {
 *   status: 'not_applicable' | 'declaration_required' | 'discriminable' | 'discriminating_evidence_gap',
 *   discriminable, pairs, gaps, suggested_depths, message
 * }
 */
export function assessDiscriminability(hypotheses, present, opts = {}) {
  const hs = hypotheses || [];
  const ladder = opts.ladder || [];
  if (hs.length < 2) {
    return { status: 'not_applicable', discriminable: null,
      message: 'Discriminability needs ≥2 competing hypotheses.' };
  }
  const guard = requireAuthoredLinks(hs);
  if (!guard.ok) {
    return { status: 'declaration_required', discriminable: null, undeclared: guard.undeclared,
      message: `${PRINCIPLE} Declare a human-authored discriminator for: ${guard.undeclared.join(', ')}.` };
  }
  const presentSet = new Set(present || []);
  const pairs = [];
  for (let i = 0; i < hs.length; i++) {
    for (let j = i + 1; j < hs.length; j++) {
      const a = hs[i], b = hs[j];
      const separators = [...new Set([...a.distinguished_by, ...b.distinguished_by])];
      const present_separators = separators.filter(s => presentSet.has(s));
      const missing = byCost(separators.filter(s => !presentSet.has(s)), ladder);
      pairs.push({
        pair: [a.id, b.id], separators, present_separators, missing,
        discriminable: present_separators.length > 0,
      });
    }
  }
  const gaps = pairs.filter(p => !p.discriminable);
  const discriminable = gaps.length === 0;
  if (discriminable) {
    return { status: 'discriminable', discriminable: true, pairs, gaps: [],
      message: 'Declared discriminating evidence is present — the hypotheses are distinguishable.' };
  }
  // For each undiscriminable pair, suggest the SHALLOWEST declared-but-missing discriminator (cost
  // ordering of human-declared options — still no inference about what discriminates).
  const suggested_depths = gaps.map(g => ({ pair: g.pair, suggested_depth: g.missing[0] || null }));
  return {
    status: 'discriminating_evidence_gap', discriminable: false, pairs, gaps, suggested_depths,
    message: gaps.map(g => `Cannot discriminate between ${g.pair.join(' and ')} given current evidence.`).join(' '),
  };
}

/** Bridge to the kernel fail-safe: only a definitive false (a real gap) sets the flag; a
 *  declaration_required / not_applicable result is null (the kernel skips, nothing is asserted). */
export function toFailSafeSignal(assessment) {
  if (!assessment || assessment.discriminable === null) return {};
  return { variables_distinguishable: assessment.discriminable };
}

export default { PRINCIPLE, requireAuthoredLinks, assessDiscriminability, toFailSafeSignal };
