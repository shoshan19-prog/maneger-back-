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

// --- System Readiness: engineering judgment (explicit, defensible) ---
const system = [
  ['Infrastructure (contract, endpoints, harness)', 100],
  ['Identity / Axis Authority (axes, materials, equipment)', 88],
  ['Evidence pipeline (ingest, preview, parser, converter)', 85],
  ['Boundary engine (derive, contradiction, couplings, next)', 75],
  ['Tooling & tests (64 assertions / 10 files)', 90],
];
const systemReadiness = Math.round(system.reduce((s, [, v]) => s + v, 0) / system.length);

// --- Scientific Readiness: scaffolding vs validated knowledge ---
const scientific = [
  ['Scientific scaffolding (axes defined, hypotheses, protocols, pre-registration)', 45],
  ['Validated knowledge (boundaries from real data, verified couplings, reproductions)', 5],
];
const scientificReadiness = Math.round(scientific.reduce((s, [, v]) => s + v, 0) / scientific.length);

const bar = (p) => '█'.repeat(Math.round(p / 10)) + '░'.repeat(10 - Math.round(p / 10));
console.log('\nMATRIYA — Project Scoreboard (two measures)\n');
console.log(`${bar(systemReadiness)}  ${systemReadiness}%  SYSTEM READINESS  (how much is built)`);
system.forEach(([k, v]) => console.log(`            ${String(v).padStart(3)}%  ${k}`));
console.log('');
console.log(`${bar(scientificReadiness)}  ${scientificReadiness}%  SCIENTIFIC READINESS  (how much is proven)`);
scientific.forEach(([k, v]) => console.log(`            ${String(v).padStart(3)}%  ${k}`));
console.log('\nKnowledge KPIs (counted from configs):');
for (const [k, v] of Object.entries(kpi)) console.log(`   ${String(v).toString().padStart(9)}  ${k}`);
console.log('\nThe number that matters most: Verified Couplings = ' + verifiedCouplings +
  ', Derived Boundaries (real data) = 0. Until those move, scientific value is ~0 regardless of system %.\n');
