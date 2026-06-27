/**
 * Experiment Linking — links an experiment to a formula AND measures its VALUE by how much it moves
 * Knowledge Δ (Fresco), not merely by which formula it belongs to. Pure / no I/O.
 *
 * "Experiment 17 belongs to Formula 5" is useful but silent on what CHANGED because of it. Here an
 * experiment carries a CONTRIBUTION (evidence added, authority matured, boundaries born); applying
 * it to a knowledge state and running the Knowledge Δ engine yields its learning value.
 *
 * Pre-registration (declaration precedes measurement): an experiment declares an
 * `expected_contribution` BEFORE running, so experiments can be RANKED by projected Knowledge Δ —
 * "which experiment to run next" = the one that would move Authority/Boundary/Evidence the most.
 * Once completed, `actual_contribution` replaces the projection.
 *
 * Boundary: a measurement carries authority source=measurement — this is the ONLY path by which
 * measurement coverage rises above 0%. A pre-registered-but-unrun experiment contributes nothing
 * to the actual state (value is projected only), never faked into the real Δ.
 */
import { buildState, computeDelta, authorityMaturity } from './knowledgeDelta.js';

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

function cloneState(s) {
  return {
    formula_ids: new Set(s.formula_ids),
    materials: new Set(s.materials),
    composition: new Map([...s.composition].map(([k, v]) => [k, new Map(v)])),
    authority: new Map([...s.authority].map(([k, v]) => [k, { ...v }])),
    boundaries: new Map([...s.boundaries].map(([k, v]) => [k, v])),
    evidence: { ...s.evidence },
  };
}

/**
 * Apply a contribution to a knowledge state, returning a NEW state.
 * @param contribution { evidence:{axis:n}, authority:[{formula_id,material,to:{field,source}}], boundaries:[{id,statement}] }
 */
export function applyContribution(state, contribution = {}) {
  const next = cloneState(state);
  for (const [axis, n] of Object.entries(contribution.evidence || {})) next.evidence[axis] = (next.evidence[axis] || 0) + n;
  for (const a of contribution.authority || []) {
    const key = `${a.formula_id}|${norm(a.material)}`;
    const cur = next.authority.get(key);
    // only a MATURATION takes effect (never regress; never invent a key that isn't represented)
    if (cur && authorityMaturity(a.to) > authorityMaturity(cur)) next.authority.set(key, a.to);
  }
  for (const b of contribution.boundaries || []) next.boundaries.set(b.id || norm(b.statement), b);
  return next;
}

// Learning-weighted value: a born boundary > a matured datum > an added evidence item. Identity /
// composition do NOT count toward value — they are change, not learning (Knowledge Δ engine).
const WEIGHTS = { evidence: 1, authority: 3, boundary: 5 };

/** The value of one experiment = its Knowledge Δ contribution against a state. Projected if unrun. */
export function experimentValue(state, exp) {
  const completed = exp.status === 'completed';
  const contribution = completed ? exp.actual_contribution : exp.expected_contribution;
  if (!contribution) return { experiment_id: exp.id, formula_id: exp.formula_id, projected: !completed, learning_value: 0, learned: false, delta: null };
  const after = applyContribution(state, contribution);
  const delta = computeDelta(state, after);
  const c = delta.summary.counts;
  const learning_value = c.evidence * WEIGHTS.evidence + c.authority * WEIGHTS.authority + c.boundary * WEIGHTS.boundary;
  return {
    experiment_id: exp.id,
    formula_id: exp.formula_id,
    projected: !completed,
    learning_value,
    learned: delta.summary.learned,
    measurement_coverage_from: delta.summary.measurement_coverage_from,
    measurement_coverage_to: delta.summary.measurement_coverage_to,
    delta,
  };
}

/** Rank experiments by their (projected or actual) learning value — the next-experiment lever. */
export function rankByValue(state, experiments = []) {
  return experiments.map(e => experimentValue(state, e)).sort((a, b) => b.learning_value - a.learning_value);
}

/** Apply a set of completed experiments cumulatively → the resulting knowledge state. */
export function applyCompleted(state, experiments = []) {
  return experiments.filter(e => e.status === 'completed' && e.actual_contribution)
    .reduce((s, e) => applyContribution(s, e.actual_contribution), state);
}

export { buildState };
export default { applyContribution, experimentValue, rankByValue, applyCompleted, buildState };
