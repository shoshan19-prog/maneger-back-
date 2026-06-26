#!/usr/bin/env node
/**
 * Governance gate runner (Fresco): evaluate Gates K / E / A from lib/governanceGates.js.
 * Architecture checks are enforced NOW; data checks show their current value but stay PENDING
 * until the Gold Standard locks the thresholds. Run: npm run gate
 *
 * Verdicts: PASS / FAIL (architecture) · PENDING (data, not yet enforceable).
 * Fan-out is allowed only when Gate K is fully green (architecture PASS + data thresholds met).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const { GATES } = await import(pathToFileURL(path.resolve(root, 'lib/governanceGates.js')).href);

const gtPath = path.resolve(root, '.corpus/ground_truth.json');
const goldPath = path.resolve(root, '.corpus/gold_standard_v1.json');
const node = (f, a = []) => spawnSync('node', [path.resolve(root, f), ...a], { encoding: 'utf8' });
const loadDocs = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')).docs || []; } catch { return null; } };

// architecture evaluators (enforceable now)
const ARCH = {
  registry_consistency: () => node('tests/registryConsistency.test.mjs').status === 0 ? ['PASS', ''] : ['FAIL', 'see registryConsistency.test'],
  corpus_integrity: () => { const r = node('scripts/corpus_cache.mjs'); return /⚠/.test((r.stdout || '') + (r.stderr || '')) ? ['FAIL', 'sha drift / removed snapshot'] : ['PASS', '']; },
  ground_truth_exists: () => fs.existsSync(gtPath) ? ['PASS', ''] : ['FAIL', 'run ground_truth.mjs skeleton'],
};

// current values for data checks (shown, but PENDING until thresholds are locked on Gold Standard)
const gold = loadDocs(goldPath);
const docs = gold || loadDocs(gtPath) || [];
const verified = docs.filter(d => d.validation && d.validation.confidence === 'verified').length;
const coverage = docs.length ? Math.round(100 * verified / docs.length) : 0;
const DATA_VALUE = {
  authority_coverage_min: () => `${coverage}% verified (${verified}/${docs.length})`,
  verified_objects: () => `${verified}`,
  provisional_objects: () => `${docs.length - verified}`,
  open_contradictions: () => 'n/a (contradiction engine not wired to corpus yet)',
  spec_precision: () => gold ? 'run ground_truth.mjs score' : 'awaiting Gold Standard',
  spec_recall: () => gold ? 'run ground_truth.mjs score' : 'awaiting Gold Standard',
  product_detection: () => gold ? 'run ground_truth.mjs score' : 'awaiting Gold Standard',
  family_detection: () => gold ? 'run ground_truth.mjs score' : 'awaiting Gold Standard',
  parser_drift: () => gold ? 'compare to frozen Gold Standard' : 'awaiting Gold Standard',
};

let fanoutOK = true;
console.log('\nMATRIYA Governance Gates (architecture enforced now · data PENDING until Gold Standard)\n');
for (const g of GATES) {
  console.log(`Gate ${g.id} — ${g.name}  (blocks: ${g.blocks})`);
  for (const c of g.checks) {
    let status, detail;
    if (c.kind === 'architecture') { [status, detail] = ARCH[c.id](); if (status === 'FAIL' && g.id === 'K') fanoutOK = false; }
    else { status = 'PENDING'; detail = `${(DATA_VALUE[c.id] || (() => ''))()}  [threshold ${c.threshold}]`; if (g.id === 'K') fanoutOK = false; }
    const tag = status === 'PASS' ? '✓ PASS ' : status === 'FAIL' ? '✗ FAIL ' : '… PEND ';
    console.log(`  ${tag} ${c.id.padEnd(22)} ${detail}`);
  }
  console.log('');
}
console.log(`Fan-out (mass extraction): ${fanoutOK ? 'ALLOWED' : 'BLOCKED'} — ${fanoutOK ? 'Gate K fully green' : 'Gate K not fully green (data checks pending Gold Standard)'}\n`);
