/**
 * Contradiction detection over observations (C2). A capability that only exists once
 * data is canonical: surface observations that DISAGREE under the same context on the
 * same canonical axis — a hidden co-factor or a data error, both high-value signals.
 * A pure-RAG system can never do this (no canonical axes/conditions to compare on).
 *
 * Two kinds:
 *   - outcome_conflict: same axis + same context, but one Works and another Fails.
 *   - value_conflict:   same axis + same context, response values differ by > MME
 *                       (a reproducibility problem). Only flagged when an MME is known.
 *
 * Pure / no I/O.
 */

const round = (x, step) => step ? Math.round(Number(x) / step) * step : Number(x);

/** Build a context key from the critical condition axes (+ formulation if present). */
function contextKey(o, criticalKeys, buckets) {
  const parts = [];
  const c = o.conditions || {};
  if (c.formulation?.value) parts.push('f=' + c.formulation.value);
  for (const k of criticalKeys) {
    const v = c[k]?.value;
    if (v != null) parts.push(`${k}=${round(v, buckets[k])}`);
  }
  return parts.join('|') || '(no-context)';
}

/**
 * @param {Array} observations  contract-shaped observations
 * @param {object} opts
 *   - axisMme: { [axis_id]: number }   noise floor per axis (for value_conflict)
 *   - criticalKeys: string[]           condition axes to hold equal (default: ['FILM_THICKNESS'])
 *   - buckets: { [key]: number }       rounding step per condition (default {FILM_THICKNESS:100})
 * @returns {Array} contradictions
 */
export function findContradictions(observations, opts = {}) {
  const axisMme = opts.axisMme || {};
  const criticalKeys = opts.criticalKeys || ['FILM_THICKNESS'];
  const buckets = opts.buckets || { FILM_THICKNESS: 100 };

  // group by axis, then by context
  const byAxis = {};
  for (const o of observations || []) {
    if (!o || !o.axis_id || !Number.isFinite(Number(o.value))) continue;
    (byAxis[o.axis_id] ||= []).push(o);
  }

  const out = [];
  for (const [axis, list] of Object.entries(byAxis)) {
    const groups = {};
    for (const o of list) (groups[contextKey(o, criticalKeys, buckets)] ||= []).push(o);
    for (const [ctx, group] of Object.entries(groups)) {
      if (group.length < 2) continue;
      // outcome conflict
      const outcomes = new Set(group.map(o => o.outcome_class).filter(Boolean));
      if (outcomes.has('works') && outcomes.has('fails')) {
        out.push({ type: 'outcome_conflict', axis, context: ctx, severity: 'high',
          observations: group.filter(o => o.outcome_class === 'works' || o.outcome_class === 'fails')
            .map(o => ({ value: o.value, outcome: o.outcome_class, ref: o.provenance?.source_reference })) });
        continue;
      }
      // value conflict (needs MME)
      const mme = axisMme[axis];
      if (mme != null) {
        const vals = group.map(o => Number(o.value));
        const spread = Math.max(...vals) - Math.min(...vals);
        if (spread > mme) {
          out.push({ type: 'value_conflict', axis, context: ctx, severity: 'medium',
            spread: Number(spread.toFixed(3)), mme,
            observations: group.map(o => ({ value: o.value, ref: o.provenance?.source_reference })) });
        }
      }
    }
  }
  return out;
}

export default { findContradictions };
