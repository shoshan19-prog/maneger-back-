/**
 * Knowledge query layer — makes the captured knowledge model QUERYABLE instead of inert config.
 * Answers the questions the 4 knowledge classes were created for: "show me all engineering
 * principles / production strategies / operational rules / decision heuristics", "what is
 * verified for dry powder", "what's open for David". Pure / no I/O (caller passes loaded JSON).
 */
export const LIBRARIES = [
  'Materials', 'SOP', 'Requirement', 'Experiment', 'Decision', 'Knowledge Graph', 'Engineering Playbook',
];

/** Engineering-playbook rules filtered by knowledge_class and/or family scope. */
export function rules(playbook, { knowledge_class, family } = {}) {
  let out = (playbook.rules || []);
  if (knowledge_class) out = out.filter(r => r.knowledge_class === knowledge_class);
  if (family) out = out.filter(r => (r.confidence_scope?.verified_for || []).some(s => s.toLowerCase().includes(family.toLowerCase())));
  return out;
}

/** Count rules per knowledge_class. */
export function byClass(playbook) {
  const c = {};
  for (const r of (playbook.rules || [])) c[r.knowledge_class] = (c[r.knowledge_class] || 0) + 1;
  return c;
}

/** Open operational-knowledge questions + the active one. */
export function questions(queue) {
  return { active: queue.active_question || null, mode: queue.intake_mode || null, open: (queue.questions || []).map(q => ({ id: q.id, area: q.area, question: q.question })) };
}

/** A compact summary of the whole knowledge model. */
export function summary({ playbook, streams, queue }) {
  return {
    libraries: LIBRARIES,
    streams: (streams.streams || []).map(s => ({ id: s.id, label: s.label, validator: s.validator, status: s.status })),
    engineering_rules: (playbook.rules || []).length,
    by_class: byClass(playbook),
    scope_verified: playbook.scope_verified || [],
    active_question: queue.active_question || null,
    open_questions: (queue.questions || []).length,
  };
}

export default { LIBRARIES, rules, byClass, questions, summary };
