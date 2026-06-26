/**
 * Decision Library — captures the LOGIC of a decision, not just its outcome (Fresco).
 * Why did the engineer release one batch and reject another? That reasoning is the missing
 * Decision Authority layer. A Mechanism Candidate is then born from a CRITERION that recurs
 * across many real decisions — from data, not impression. Pure / no I/O.
 *
 * Decision shape:
 *   { id, date, question, decision, alternatives_considered[], reasoning,
 *     evidence_used[EVS], authority, uncertainties[], next_action, criteria[] }
 */
export const DECISION_FIELDS = ['question', 'decision', 'reasoning', 'evidence_used', 'authority'];

export function validateDecision(d) {
  const errors = [];
  for (const f of DECISION_FIELDS) {
    const v = d?.[f];
    if (v == null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0)) errors.push(`missing: ${f}`);
  }
  return { valid: errors.length === 0, errors };
}

/** Decisions that used a given criterion (in criteria[] or as an evidence axis). */
export function byCriterion(decisions, criterion) {
  const c = String(criterion).toLowerCase();
  return (decisions || []).filter(d => (d.criteria || []).some(x => String(x).toLowerCase().includes(c)));
}

/** How often each criterion appears across decisions. */
export function criterionFrequency(decisions) {
  const f = {};
  for (const d of (decisions || [])) for (const c of (d.criteria || [])) f[c] = (f[c] || 0) + 1;
  return f;
}

/**
 * Mechanism candidates emerge from data: a criterion used in >= minDecisions distinct
 * decisions is a candidate to formalize (not before). Returns [{criterion, count, decisions[]}].
 */
export function mechanismCandidates(decisions, { minDecisions = 3 } = {}) {
  const f = criterionFrequency(decisions);
  return Object.entries(f)
    .filter(([, n]) => n >= minDecisions)
    .map(([criterion, count]) => ({ criterion, count, decisions: byCriterion(decisions, criterion).map(d => d.id) }))
    .sort((a, b) => b.count - a.count);
}

export default { DECISION_FIELDS, validateDecision, byCriterion, criterionFrequency, mechanismCandidates };
