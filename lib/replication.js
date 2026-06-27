/**
 * Replication Layer — the missing link between Knowledge Δ and Law (Fresco).
 *
 * A law is NOT born from a Knowledge Δ. It is born when a Knowledge Δ SURVIVES independent
 * replication. So a Boundary Δ from one experiment is only a CANDIDATE boundary; it earns its way
 * up a state ladder by being re-observed independently, under defined conditions:
 *
 *   candidate   — born from a single experiment
 *   supported   — re-observed independently at least once (held)
 *   established  — held across ≥2 distinct DEFINED conditions, with no in-context violation
 *   contested   — violated within its declared context (the boundary, as stated, failed)
 *
 * Two metrics, deliberately ORTHOGONAL (Fresco): learning_value (how much an experiment moved
 * knowledge) is NOT confidence (how stable that knowledge is). A finding can have high value and low
 * confidence (lots of evidence, one experiment) or low value and high confidence (small but
 * replicated). confidence here depends ONLY on replication structure, never on learning_value.
 *
 * Aligns with Law 5 (valid only in context) and Law 6 (calibrate/pre-register before measuring):
 * replications must declare their conditions; the established context IS the boundary's scope.
 * Pure / no I/O.
 */

const condSig = (c) => JSON.stringify(Object.fromEntries(Object.entries(c || {}).sort()));

function parts(b) {
  const reps = b.replications || [];
  const holds = reps.filter(r => r.held);
  const indepHolds = holds.filter(r => r.independent);
  const violations = reps.filter(r => !r.held);
  const distinctConditions = new Set(indepHolds.map(r => condSig(r.conditions))).size;
  return { reps, holds, indepHolds, violations, distinctConditions };
}

/** The boundary's state on the candidate → supported → established ladder (or contested). */
export function boundaryState(b) {
  const { indepHolds, violations, distinctConditions } = parts(b);
  if (violations.length > 0) return 'contested';            // violated in-context → must narrow/refute
  if (distinctConditions >= 2) return 'established';        // held across ≥2 defined conditions
  if (indepHolds.length >= 1) return 'supported';           // replicated independently at least once
  return 'candidate';                                       // single experiment only
}

/**
 * Confidence in 0..1 — a function of REPLICATION ONLY (independent holds, condition diversity,
 * violations). Independent of learning_value by design.
 */
export function confidence(b) {
  const { indepHolds, violations, distinctConditions } = parts(b);
  const holds = indepHolds.length;
  let c = 0.2                                                // a candidate that exists at all
    + 0.45 * (1 - Math.exp(-holds / 1.5))                   // independent holds, diminishing returns
    + 0.35 * (1 - Math.exp(-Math.max(0, distinctConditions - 1) / 1.5)) // condition diversity beyond the first
    - 0.4 * violations.length;                              // in-context violations hurt hard
  c = Math.max(0, Math.min(1, c));
  return Math.round(c * 100) / 100;
}

/** Add a replication (returns a new boundary object — pure). */
export function addReplication(b, { experiment_id, conditions = {}, held, independent = true }) {
  return { ...b, replications: [...(b.replications || []), { experiment_id, conditions, held: !!held, independent: !!independent }] };
}

/** Is a Law justified by this boundary? Only when established (and, for a general law, across domains). */
export function lawJustified(b) {
  return boundaryState(b) === 'established';
}

/** Summarize a set of boundaries — the replication scoreboard. */
export function summarize(boundaries = []) {
  const rows = boundaries.map(b => ({
    id: b.id, state: boundaryState(b), confidence: confidence(b),
    replications: (b.replications || []).length, law_justified: lawJustified(b),
  }));
  const byState = rows.reduce((a, r) => (a[r.state] = (a[r.state] || 0) + 1, a), {});
  return { rows, byState, established: rows.filter(r => r.state === 'established').length, any_law_justified: rows.some(r => r.law_justified) };
}

export default { boundaryState, confidence, addReplication, lawJustified, summarize };
