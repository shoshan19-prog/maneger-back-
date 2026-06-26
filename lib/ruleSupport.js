/**
 * RuleSupport — the Knowledge Evolution layer (Fresco). Turns engineering rules from stored
 * statements into LIVING entities: each new Evidence Set strengthens or weakens a rule, so the
 * model can answer "what strengthened this week / what is contradicted / what is ready to be
 * promoted to a verified mechanism". Pure / no I/O.
 *
 * Chain: Decision → Rule Support Update → Engineering Rule.
 * An evidence_set link: { rule_id, evs_id, stance: 'support'|'contradict', date, context? }.
 */
export function statusOf(supportCount, contradictCount) {
  const s = supportCount, c = contradictCount;
  if (c > 0 && c > s) return { status: 'refuted', confidence: 'low' };  // contradictions dominate
  if (c > 0) return { status: 'contested', confidence: 'low' };       // weakened — has a contradiction (tie or fewer)
  if (s === 0) return { status: 'asserted', confidence: 'provisional' }; // expert-only, no evidence yet
  if (s === 1) return { status: 'single_support', confidence: 'low' };   // fragile — one evidence set
  if (s >= 3) return { status: 'promotion_ready', confidence: 'high' };   // candidate → verified mechanism
  return { status: 'supported', confidence: 'medium' };
}

/** Compute the support state of one rule from the evidence-set links. */
export function computeSupport(ruleId, links = []) {
  const mine = links.filter(l => l.rule_id === ruleId);
  const supporting = mine.filter(l => l.stance === 'support').map(l => l.evs_id);
  const contradicting = mine.filter(l => l.stance === 'contradict').map(l => l.evs_id);
  const lastUpdated = mine.reduce((d, l) => (l.date && (!d || l.date > d) ? l.date : d), null);
  return { rule_id: ruleId, supporting, contradicting, support_count: supporting.length, contradict_count: contradicting.length, last_updated: lastUpdated, ...statusOf(supporting.length, contradicting.length) };
}

/** Support state for every rule. rules: [{id, knowledge_class}]. */
export function evolve(rules = [], links = []) {
  return rules.map(r => ({ knowledge_class: r.knowledge_class, ...computeSupport(r.id, links) }));
}

// --- evolution queries ---
export const promotionReady = (state) => state.filter(r => r.status === 'promotion_ready');
export const weakened = (state) => state.filter(r => r.status === 'contested' || r.status === 'refuted');
export const contradicted = (state) => state.filter(r => r.contradict_count > 0);
export const singleSupport = (state) => state.filter(r => r.status === 'single_support');
export const assertedOnly = (state) => state.filter(r => r.status === 'asserted');
/** Rules whose support/contradiction changed on/after `since` (YYYY-MM-DD). */
export const changedSince = (state, since) => state.filter(r => r.last_updated && r.last_updated >= since);

export default { statusOf, computeSupport, evolve, promotionReady, weakened, contradicted, singleSupport, assertedOnly, changedSince };
