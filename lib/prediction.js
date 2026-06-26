/**
 * Prediction — the link that closes the learning loop (Fresco). A model that only explains the
 * past is not science; every Engineering Rule (or watched pattern) must say what SHOULD happen
 * next if it is true. Prediction → Experiment → outcome → back into RuleSupport. Pure / no I/O.
 *
 * Prediction shape:
 *   { id, target (ENG-… or WP-…), prediction ("if X then Y"), measurable_outcome,
 *     experiment (E-… when assigned), status: proposed|open|confirmed|refuted, result, date, source }
 */
export const PREDICTION_FIELDS = ['target', 'prediction', 'measurable_outcome'];

export function validatePrediction(p) {
  const errors = [];
  for (const f of PREDICTION_FIELDS) if (!p?.[f] || String(p[f]).trim() === '') errors.push(`missing: ${f}`);
  if (p?.status && !['proposed', 'open', 'confirmed', 'refuted'].includes(p.status)) errors.push(`bad status: ${p.status}`);
  return { valid: errors.length === 0, errors };
}

export const forTarget = (preds, target) => (preds || []).filter(p => p.target === target);
export const open = (preds) => (preds || []).filter(p => p.status === 'open' || p.status === 'proposed');
export const resolved = (preds) => (preds || []).filter(p => p.status === 'confirmed' || p.status === 'refuted');

/**
 * Close the loop: a resolved prediction becomes a RuleSupport link feeding lib/ruleSupport.js
 * — confirmed → supports the rule, refuted → contradicts it. Returns null while unresolved.
 */
export function toRuleLink(p) {
  if (p.status !== 'confirmed' && p.status !== 'refuted') return null;
  return { rule_id: p.target, evs_id: p.experiment || p.id, stance: p.status === 'confirmed' ? 'support' : 'contradict', date: p.date || null };
}

/** All RuleSupport links derivable from resolved predictions (the loop's return path). */
export const ruleLinks = (preds) => resolved(preds).map(toRuleLink).filter(Boolean);

export default { PREDICTION_FIELDS, validatePrediction, forTarget, open, resolved, toRuleLink, ruleLinks };
