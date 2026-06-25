/**
 * Next-experiment proposer (closed-loop seed). Turns the mechanism hypotheses' `to_verify`
 * and the unverified property couplings into a RANKED experiment queue — "what to run next"
 * — by information-need: weak evidence base + unverified status + impact score highest.
 *
 * This is the active-learning core: the system points at its own blank spots. It does NOT
 * invent physics; it orders the experiments already defined by the registries.
 * Pure / no I/O.
 */

// Impact weight per property (decision relevance for Fresco; tune later from operational use).
const IMPACT = {
  EXPANSION: 3, FIRE_DRY: 5, CHAR_QUAL: 4, ADHES_DRY: 4, VISC_WET: 2,
  expansion_ratio: 3, time_to_failure: 5, char_quality: 4, pull_off_adhesion: 4,
};
const LEVEL_NEED = { Hypothesis: 3, 'Catalog-supported': 2, Mechanistic: 1, Verified: 0 };

/**
 * @param {{mechanisms?:Array, couplings?:Array}} registries
 * @returns {Array} ranked [{kind, id, experiment, score, rationale}]
 */
export function proposeExperiments({ mechanisms = [], couplings = [] } = {}) {
  const out = [];

  for (const m of mechanisms) {
    if (m.status && m.status !== 'HYPOTHESIS') continue;             // already verified/partial
    const impact = IMPACT[m.property] ?? 2;
    const n = m.evidence_ref?.experiment_count ?? m.evidence_experiment_count ?? 0;
    const weakBase = n < 5 ? 2 : (n < 12 ? 1 : 0);                   // less evidence -> higher need
    const score = impact + weakBase + 1;                            // +1: unverified always needs isolation
    out.push({
      kind: 'mechanism_isolation', id: m.property, experiment: m.to_verify,
      score, rationale: `${m.property}: HYPOTHESIS, n=${n} (${weakBase ? 'weak base' : 'enough base'}), impact=${impact}. Isolate the lever.`,
    });
  }

  for (const c of couplings) {
    const level = c.evidence_level ?? c.level;
    const need = LEVEL_NEED[level] ?? 2;
    if (need === 0) continue;                                        // Verified -> skip
    const impact = (IMPACT[c.a] ?? 2) + (IMPACT[c.b] ?? 2);
    const score = need + impact / 2;
    out.push({
      kind: 'coupling_falsification', id: c.coupling_id || c.id,
      experiment: `${c.verify || c.verify_method} | Falsifier: ${c.falsifier}`,
      score: Number(score.toFixed(2)),
      rationale: `${c.id} ${c.a}↔${c.b} (${level}); try to FALSIFY. impact=${impact}.`,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

export default { proposeExperiments };
