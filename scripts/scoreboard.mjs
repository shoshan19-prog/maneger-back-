#!/usr/bin/env node
/**
 * MATRIYA project scoreboard — TWO separate measures, because they answer two different
 * questions and conflating them is misleading (a "90%" that means "infrastructure", not
 * "validated knowledge"):
 *   1. System Readiness   — how much of the SYSTEM is built (engineering).
 *   2. Scientific Readiness — how much KNOWLEDGE is proven (empirical).
 *
 * The knowledge KPIs are COUNTED from the canonical configs (so the board can't drift from
 * reality). The engineering sub-scores are explicit judgments (marked as such). Run:
 *   npm run scoreboard
 */
import { readFileSync } from 'fs';
const cfg = (n) => JSON.parse(readFileSync(new URL('../config/' + n, import.meta.url), 'utf8'));

// --- Scientific KPIs: counted facts, not opinions ---
const axes = cfg('property_registry_canonical_v1.json').properties || [];
const couplings = cfg('coupling_registry_v1.json').couplings || [];
let mech = [];
try { mech = cfg('mechanism_hypothesis_seed_v1.json').rows || []; } catch { /* optional */ }
const verifiedCouplings = couplings.filter(c => c.level === 'Verified').length;
const axesWithProtocol = axes.filter(a => a.measurement_protocol).length;

// Derived/reproduced boundaries, decision shifts: these only become non-zero once REAL
// observations exist (observations table is not deployed yet). Counted as 0 by definition.
const kpi = {
  'Canonical Axes': axes.length,
  'Axes with measurement_protocol': axesWithProtocol,
  'Mechanism Hypotheses (seed)': mech.length,
  'Mechanistic Couplings': couplings.length,
  'Verified Couplings': verifiedCouplings,
  'Derived Boundaries (real data)': 0,
  'Reproduced Boundaries': 0,
  'Decision Shifts': 0,
  'Active Experiments': '1 (E-012)',
};

// THREE dimensions (Fresco): Infrastructure (built) · Knowledge (captured & structured) ·
// Validation (proven). Engineering judgment, explicit and defensible.
const DIMENSIONS = [
  ['INFRASTRUCTURE READINESS  (how much is built)', [
    ['Repository & harness', 100],
    ['Governance (Gates K/E/A, authority layers)', 90],
    ['Libraries (7 knowledge libraries scaffolded)', 85],
    ['Ontology (axes, measurement, capability, variable-class)', 95],
    ['Tooling & tests (83 assertions / 13 files)', 90],
  ]],
  ['KNOWLEDGE READINESS  (how much is captured & structured)', [
    ['Operational Knowledge (David — playbook, 10 rules, verified)', 60],
    ['Document Knowledge (spec library v3, parser ready; few products)', 40],
    ['Experimental Knowledge (E-012 designed; 0 real data)', 15],
  ]],
  ['SCIENTIFIC VALIDATION  (how much is proven)', [
    ['Verified couplings', 0],
    ['Derived boundaries (real data)', 0],
    ['Reproductions', 0],
    ['Prediction / external validation', 0],
    ['Calibration dry-run (E-011, synthetic)', 25],
  ]],
];
const bar = (p) => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10));
console.log('\nMATRIYA — Project Scoreboard (three dimensions)\n');
for (const [title, subs] of DIMENSIONS) {
  const score = Math.round(subs.reduce((s, [, v]) => s + v, 0) / subs.length);
  console.log(`${bar(score)}  ${score}%  ${title}`);
  subs.forEach(([k, v]) => console.log(`            ${String(v).padStart(3)}%  ${k}`));
  console.log('');
}
console.log('\nKnowledge KPIs (counted from configs):');
for (const [k, v] of Object.entries(kpi)) console.log(`   ${String(v).toString().padStart(9)}  ${k}`);
console.log('\nThe number that matters most: Verified Couplings = ' + verifiedCouplings +
  ', Derived Boundaries (real data) = 0. Until those move, scientific value is ~0 regardless of system %.\n');
