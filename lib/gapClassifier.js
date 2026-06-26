/**
 * Gap Classifier — the three gap types (Fresco). When information is missing, the system must
 * not reflexively ask the user OR reflexively order a lab test. It must first decide WHICH kind
 * of gap it is, because each has a different, minimum-cost response:
 *
 *   Knowledge Gap  → "ask one short question"          (answerable from the expert's experience)
 *   Evidence Gap   → "Requires Experimental Evidence"  (no data exists at all)
 *   Discovery Gap  → "Requires Deeper Observation"     (data EXISTS but cannot distinguish the
 *                                                        competing hypotheses — what is missing
 *                                                        is observation DEPTH, not a new run)
 *
 * The Discovery Gap is the subtle one: the answer is not "experiment again" but "look closer at
 * what you already have, at the SHALLOWEST depth that would discriminate H1 from H2". Pure / no I/O.
 *
 * IMPORTANT (the boundary, Fresco): a Discovery Gap is a *Discriminating Evidence Gap* and is
 * formally decided by lib/discriminability.js. What discriminates H1 from H2 is HUMAN-AUTHORED —
 * the system never infers it; it only checks whether the declared discriminator is present. The
 * `discriminates` predicate below therefore stands for a human DECLARATION, not a system judgement.
 *
 * config/discovery_depths_v1.json holds the depth ladder + worked example.
 */

export const GAP_TYPES = {
  knowledge_gap: { action: 'ask one short question', label: 'Knowledge Gap' },
  evidence_gap: { action: 'Requires Experimental Evidence', label: 'Evidence Gap' },
  discovery_gap: { action: 'Requires Deeper Observation', label: 'Discovery Gap' },
};

/**
 * Classify a gap from three orthogonal facts about the missing information:
 *   - user_can_answer       the expert can answer it from experience (no measurement needed)
 *   - has_data              observations relevant to the question already exist
 *   - hypotheses_resolved   the existing data already distinguishes the competing hypotheses
 *
 * Order matters: a knowledge gap is checked first (cheapest to close — just ask). If the expert
 * cannot answer, we ask whether data exists at all (evidence gap) before asking whether the data
 * we DO have is deep enough to discriminate (discovery gap).
 *
 * @returns { type, action, reason }
 */
export function classifyGap({ user_can_answer = false, has_data = false, hypotheses_resolved = false } = {}) {
  if (user_can_answer) {
    return { type: 'knowledge_gap', action: GAP_TYPES.knowledge_gap.action,
      reason: 'answerable from expert experience — no measurement needed' };
  }
  if (!has_data) {
    return { type: 'evidence_gap', action: GAP_TYPES.evidence_gap.action,
      reason: 'no data exists at all — an experiment is required' };
  }
  if (!hypotheses_resolved) {
    return { type: 'discovery_gap', action: GAP_TYPES.discovery_gap.action,
      reason: 'data exists but cannot distinguish the competing hypotheses — observe deeper, do not re-run' };
  }
  return { type: null, action: 'no gap — hypotheses already discriminated by existing data', reason: 'resolved' };
}

/**
 * Recommend the SHALLOWEST depth on the ladder that would discriminate the competing hypotheses.
 * A Discovery Gap's whole point is minimum cost: do not jump to SEM/FTIR when a macro photograph
 * or a remix-recoverability check already separates H1 from H2.
 *
 * @param ladder       array of { id, rank, cost, reveals, discriminates? } (from discovery_depths_v1)
 * @param discriminates predicate(depth) → true if that depth separates the hypotheses.
 *                      Defaults to a depth's own `discriminates` flag when present.
 * @returns the chosen depth object, or null if nothing on the ladder discriminates.
 */
export function recommendDepth(ladder, discriminates) {
  const pred = discriminates || ((d) => d.discriminates === true);
  const ordered = [...(ladder || [])].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  return ordered.find(pred) || null;
}

/**
 * Full Discovery-Gap recommendation: classify, and if it is a discovery gap, attach the shallowest
 * discriminating depth. One call for the decision layer.
 */
export function recommend({ user_can_answer, has_data, hypotheses_resolved, ladder, discriminates } = {}) {
  const g = classifyGap({ user_can_answer, has_data, hypotheses_resolved });
  if (g.type !== 'discovery_gap') return g;
  const depth = recommendDepth(ladder, discriminates);
  return { ...g, suggested_depth: depth ? depth.id : null,
    note: depth ? `shallowest depth that discriminates — no deeper observation needed yet` : 'no ladder depth discriminates — escalate' };
}

/**
 * Map a Discriminability Assessment (lib/discriminability.js) onto the gap vocabulary. A
 * discriminating_evidence_gap IS the Discovery Gap, with its suggested depth taken from the
 * human-declared (not inferred) missing discriminator. Keeps the two layers in one language.
 */
export function fromDiscriminability(assessment) {
  if (!assessment) return null;
  if (assessment.status === 'discriminating_evidence_gap') {
    return { type: 'discovery_gap', action: GAP_TYPES.discovery_gap.action,
      reason: assessment.message,
      suggested_depth: assessment.suggested_depths?.[0]?.suggested_depth ?? null };
  }
  if (assessment.status === 'declaration_required') {
    return { type: 'declaration_required', action: 'Requires Human-Authored Discriminator',
      reason: assessment.message };
  }
  return { type: null, action: 'no discriminability gap', reason: assessment.message };
}

export default { GAP_TYPES, classifyGap, recommendDepth, recommend, fromDiscriminability };
