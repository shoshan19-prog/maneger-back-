/**
 * Learning KPI — measures KNOWLEDGE GENERATION, not activity (Fresco). Representing knowledge
 * consistently is not the same as creating it: the test is whether the knowledge graph CHANGED.
 * So the headline metric is Knowledge Delta (graph(t+1) ≠ graph(t)?), plus four real KPIs:
 * Questions Answered · Knowledge Delta · Prediction Accuracy · Engineering Impact. Pure / no I/O.
 */
const RANK = { refuted: -2, contested: -1, asserted: 0, single_support: 1, supported: 2, promotion_ready: 3 };

export function computeLearningKpi({ questions = [], predictions = [], mechanisms = [], watchedPatterns = [], ruleState = [], decisions = [] } = {}) {
  const isResolvedQ = (q) => q.status === 'resolved' || q.answered === true;
  const confirmed = predictions.filter(p => p.status === 'confirmed').length;
  const refuted = predictions.filter(p => p.status === 'refuted').length;
  const dist = ruleState.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
  const resolvedPred = confirmed + refuted;
  return {
    questions_answered: questions.filter(isResolvedQ).length,
    open_questions: questions.filter(q => !isResolvedQ(q)).length,
    active_predictions: predictions.filter(p => p.status === 'open' || p.status === 'proposed').length,
    resolved_predictions: resolvedPred,
    // Prediction Accuracy — the real measure of knowledge quality (null until any resolve)
    prediction_accuracy: resolvedPred ? Math.round(100 * confirmed / resolvedPred) : null,
    // Engineering Impact — decisions changed because of new knowledge (cite a rule/mechanism)
    engineering_impact: decisions.filter(d => (d.driven_by_rules || []).length || d.changed_by_new_knowledge).length,
    confirmed_mechanisms: mechanisms.filter(m => m.status === 'verified' || m.status === 'observed').length,
    candidate_mechanisms: mechanisms.filter(m => m.status === 'candidate').length,
    watched_patterns: watchedPatterns.length,
    refuted_rules: dist.refuted || 0,
    weakened_rules: (dist.contested || 0) + (dist.refuted || 0),
    promotion_ready_rules: dist.promotion_ready || 0,
    asserted_rules: dist.asserted || 0,
    rule_status_distribution: dist,
  };
}

/** Build a comparable snapshot (the graph state at time t). */
export function snapshot({ ruleState = [], questions = [], predictions = [], mechanisms = [] }, date = null) {
  return {
    date,
    rule_status: Object.fromEntries(ruleState.map(r => [r.rule_id || r.id, r.status])),
    questions_answered: questions.filter(q => q.status === 'resolved' || q.answered === true).length,
    predictions_confirmed: predictions.filter(p => p.status === 'confirmed').length,
    predictions_refuted: predictions.filter(p => p.status === 'refuted').length,
    mechanisms_confirmed: mechanisms.filter(m => m.status === 'verified' || m.status === 'observed').length,
  };
}

/** Knowledge Delta — did the graph change since the previous snapshot? The core "is it learning?" metric. */
export function computeKnowledgeDelta(prev, curr) {
  if (!prev) return { baseline: true, changed: false, new_rules: 0, strengthened: 0, weakened: 0, refuted: 0, questions_answered: 0, predictions_resolved: 0, mechanisms_confirmed: 0 };
  const ps = prev.rule_status || {}, cs = curr.rule_status || {};
  let nw = 0, str = 0, wk = 0, ref = 0;
  for (const id of Object.keys(cs)) {
    if (!(id in ps)) { nw++; continue; }
    if (cs[id] === 'refuted' && ps[id] !== 'refuted') { ref++; continue; }
    const a = RANK[ps[id]] ?? 0, b = RANK[cs[id]] ?? 0;
    if (b > a) str++; else if (b < a) wk++;
  }
  const qa = (curr.questions_answered || 0) - (prev.questions_answered || 0);
  const pr = ((curr.predictions_confirmed || 0) + (curr.predictions_refuted || 0)) - ((prev.predictions_confirmed || 0) + (prev.predictions_refuted || 0));
  const mc = (curr.mechanisms_confirmed || 0) - (prev.mechanisms_confirmed || 0);
  return { baseline: false, changed: (nw + str + wk + ref + qa + pr + mc) > 0, new_rules: nw, strengthened: str, weakened: wk, refuted: ref, questions_answered: qa, predictions_resolved: pr, mechanisms_confirmed: mc };
}

export default { computeLearningKpi, snapshot, computeKnowledgeDelta };
