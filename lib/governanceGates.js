/**
 * Governance Gates — the CONTRACT (Fresco). Three gates, not one. Each check is tagged:
 *   kind:'architecture' — depends only on the system; lockable & enforceable NOW.
 *   kind:'data'         — depends on the Gold Standard; declared now, enforced LATER
 *                         (pending:true → never fails the build until thresholds are locked).
 *
 * This module is pure data + describe(); scripts/gates.mjs evaluates it. Freezing this
 * contract means every future knowledge library (SOP, Experiments, Formula, TDS) enters the
 * SAME governance frame from day one.
 */
export const GATES = [
  {
    id: 'K', name: 'Knowledge Readiness', blocks: 'Fan-out (mass extraction)',
    checks: [
      { id: 'registry_consistency', kind: 'architecture', how: 'tests/registryConsistency.test.mjs exit 0' },
      { id: 'corpus_integrity', kind: 'architecture', how: 'corpus_cache append-only (no sha drift)' },
      { id: 'ground_truth_exists', kind: 'architecture', how: '.corpus/ground_truth.json present' },
      { id: 'authority_coverage_min', kind: 'data', threshold: '>=80% docs verified', pending: true },
    ],
  },
  {
    id: 'E', name: 'Extraction Quality', blocks: 'knowledge-library update',
    checks: [
      { id: 'spec_precision', kind: 'data', threshold: '>=99%', pending: true },
      { id: 'spec_recall', kind: 'data', threshold: '>=99%', pending: true },
      { id: 'product_detection', kind: 'data', threshold: '>=99%', pending: true },
      { id: 'family_detection', kind: 'data', threshold: '>=98%', pending: true },
      { id: 'parser_drift', kind: 'data', threshold: '0 regressions vs Gold Standard', pending: true },
    ],
  },
  {
    id: 'A', name: 'Authority Readiness', blocks: 'decision-making',
    checks: [
      { id: 'verified_objects', kind: 'data', threshold: 'count (informational)', pending: true },
      { id: 'provisional_objects', kind: 'data', threshold: 'count (informational)', pending: true },
      { id: 'open_contradictions', kind: 'data', threshold: '0', pending: true },
    ],
  },
];

export const describe = () =>
  GATES.map(g => `Gate ${g.id} — ${g.name} (blocks: ${g.blocks})\n` +
    g.checks.map(c => `  [${c.kind === 'architecture' ? 'LOCK' : 'pend'}] ${c.id}${c.threshold ? ' (' + c.threshold + ')' : ''}`).join('\n')
  ).join('\n\n');

export default { GATES, describe };
