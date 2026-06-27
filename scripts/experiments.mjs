#!/usr/bin/env node
/**
 * Experiment value CLI — ranks experiments by their Knowledge Δ contribution, not their link.
 * Splits COMPLETED (learning history) from PRE-REGISTERED (ranked by projected Δ → next experiment).
 * Reads config/experiment_registry_v1.json + the corpus state. Aggregates only.
 * Usage: npm run experiments
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const D = await import(pathToFileURL(path.resolve(root, 'lib/knowledgeDelta.js')).href);
const X = await import(pathToFileURL(path.resolve(root, 'lib/experimentLink.js')).href);

const corpusFile = path.join(root, '.corpus', 'formulas_v1.json');
const formulas = fs.existsSync(corpusFile) ? JSON.parse(fs.readFileSync(corpusFile, 'utf8')).formulas.map(f => f.canonical).filter(Boolean) : [];
const state = D.buildState(formulas);
const experiments = cfg('experiment_registry_v1.json').experiments || [];

const fmt = (v) => `value=${v.learning_value}  (ev ${v.delta?.summary.counts.evidence || 0} · auth ${v.delta?.summary.counts.authority || 0} · bound ${v.delta?.summary.counts.boundary || 0})  learned=${v.learned}`;

console.log('\nExperiment value = its Knowledge Δ contribution (not its link)\n');

const completed = experiments.filter(e => e.status === 'completed');
console.log(`COMPLETED — learning history (${completed.length}):`);
for (const e of completed) console.log(`  ${e.id} [${e.domain}] → ${fmt(X.experimentValue(state, e))}`);

const pending = experiments.filter(e => e.status === 'pre_registered');
console.log(`\nPRE-REGISTERED — ranked by PROJECTED Δ (next experiment, ${pending.length}):`);
const ranked = X.rankByValue(state, pending);
ranked.forEach((v, i) => console.log(`  ${i === 0 ? '►' : ' '} ${v.experiment_id} → projected ${fmt(v)}`));

if (ranked[0]) {
  const top = experiments.find(e => e.id === ranked[0].experiment_id);
  console.log(`\nNext experiment by projected Knowledge Δ: ${ranked[0].experiment_id}`);
  console.log(`  ${top?.note || ''}`);
}
console.log('\nReading: an experiment\'s worth is what it MOVES (Authority/Boundary/Evidence), not which');
console.log('formula it links to. E-012 ranks high because it would BIRTH a boundary E-011 could not.\n');
