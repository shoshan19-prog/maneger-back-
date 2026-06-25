#!/usr/bin/env node
// Evidence-based progress by CAPABILITY AREA (David's framing). Bars show where the
// bottleneck is at a glance. % are assessed from artifacts present + empirical status.
import { readdirSync, existsSync } from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const has = (d, re) => existsSync(path.join(root, d)) && readdirSync(path.join(root, d)).some(f => re.test(f));
const n = (d, re) => existsSync(path.join(root, d)) ? readdirSync(path.join(root, d)).filter(f => re.test(f)).length : 0;

// each area: assessed % (code/data evidence drives the buildable part; empirical is lab-gated)
const areas = [
  ['Infrastructure (contract, endpoints, tooling)', 100],
  ['Identity (materials, axes, equipment)',          80],
  ['Evidence Pipeline (ingest/lint/backfill)',       70],
  ['Boundary Engine (derive/contradiction/couplings/next)', 60],
  ['Laboratory Calibration (T_noise/MME, specs)',    10],
  ['Operational Validation (E-011 run, decision_shift)', 0],
];
const bar = p => '█'.repeat(Math.round(p/10)) + '░'.repeat(10 - Math.round(p/10));
console.log('MATRIYA Boundary Intelligence — evidence-based progress\n');
for (const [name, p] of areas) console.log(`${bar(p)} ${String(p).padStart(3)}%  ${name}`);
const overall = Math.round(areas.reduce((s,[,p])=>s+p,0)/areas.length);
console.log(`\nOverall (mean): ${overall}%   Bottleneck: Laboratory Calibration -> Operational Validation (lab-gated)`);
console.log('\nArtifacts: ' +
  `${n('lib',/\.js$/)} libs, ${n('tests',/\.test\.mjs$/)} test files, ` +
  `${n('migrations',/^0(0[7-9]|1[0-4])_(observation|axes|equipment|couplings|mechanism|materials_seed)/)} boundary migrations, ` +
  `${n('config',/\.json$/)} configs`);
