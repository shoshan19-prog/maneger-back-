/**
 * Learning KPI — measures KNOWLEDGE CREATION, not software (Fresco). Not a registry; a read
 * over the existing ones (interview queue, predictions, mechanism registry, rule support).
 * It answers: is MATRIYA actually learning? Most values are 0 until the loop runs on real data
 * — that is the point. Pure / no I/O (caller passes extracted inputs).
 */
export function computeLearningKpi({ questions = [], predictions = [], mechanisms = [], watchedPatterns = [], ruleState = [] } = {}) {
  const isResolvedQ = (q) => q.status === 'resolved' || q.answered === true;
  const predOpen = predictions.filter(p => p.status === 'open' || p.status === 'proposed').length;
  const predResolved = predictions.filter(p => p.status === 'confirmed' || p.status === 'refuted').length;
  const dist = ruleState.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});

  return {
    new_questions: questions.length,
    resolved_questions: questions.filter(isResolvedQ).length,
    open_questions: questions.filter(q => !isResolvedQ(q)).length,
    active_predictions: predOpen,
    resolved_predictions: predResolved,
    confirmed_mechanisms: mechanisms.filter(m => m.status === 'verified' || m.status === 'observed').length,
    candidate_mechanisms: mechanisms.filter(m => m.status === 'candidate').length,
    watched_patterns: watchedPatterns.length,
    refuted_rules: dist.refuted || 0,
    weakened_rules: (dist.contested || 0) + (dist.refuted || 0),
    promotion_ready_rules: dist.promotion_ready || 0,
    asserted_rules: dist.asserted || 0,
    rule_status_distribution: dist,
    // a single "is the loop turning?" signal: anything that moved knowledge
    loop_activity: predResolved + (mechanisms.length) + (questions.filter(isResolvedQ).length),
  };
}

/** Snapshot for trend tracking: caller persists these over time; trend = compare snapshots. */
export const snapshot = (kpi, date) => ({ date: date || null, ...kpi });

export default { computeLearningKpi, snapshot };
