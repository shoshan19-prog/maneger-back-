#!/usr/bin/env node
/**
 * Knowledge Δ CLI — classifies what knowledge changed between two states. By default it shows the
 * Δ from an EMPTY baseline → the current corpus (i.e. the knowledge we currently hold, classified
 * by type), with the all-important measurement-coverage figure. Reads .corpus/formulas_v1.json
 * (proprietary); prints aggregates only.
 * Usage:
 *   npm run delta            # empty → current corpus, by the five Δ types
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const D = await import(pathToFileURL(path.resolve(root, 'lib/knowledgeDelta.js')).href);

const file = path.join(root, '.corpus', 'formulas_v1.json');
if (!fs.existsSync(file)) { console.error('No .corpus/formulas_v1.json — run `npm run formulas` first.'); process.exit(1); }
const formulas = JSON.parse(fs.readFileSync(file, 'utf8')).formulas.map(f => f.canonical).filter(Boolean);

const baseline = D.buildState([]);                 // empty — nothing known
const current = D.buildState(formulas);            // what we hold today
const d = D.computeDelta(baseline, current);

console.log('\nKnowledge Δ — empty baseline → current corpus (what did we learn / hold?)\n');
const c = d.summary.counts;
console.log(`  1. Identity Δ    : ${c.identity}  (formulas ${d.identity.new_formulas.length} · materials ${d.identity.new_materials.length})`);
console.log(`  2. Composition Δ : ${c.composition}  (within shared formulas only — all formulas are new here, see Identity)`);
console.log(`  3. Authority Δ   : ${c.authority}  (maturation of EXISTING datums — 0 from empty baseline, by design)`);
console.log(`  4. Boundary Δ    : ${c.boundary}  (no boundaries declared yet)`);
console.log(`  5. Evidence Δ    : ${c.evidence}  (no measurement evidence yet)`);
console.log(`\n  Measurement coverage: ${d.summary.measurement_coverage_from}% → ${d.summary.measurement_coverage_to}%`);
console.log(`  Learned (authority/boundary/evidence moved?): ${d.summary.learned}`);
console.log('\nReading: we have BUILT a knowledge state (identity), but not yet LEARNED — measurement');
console.log('coverage is 0%, no boundary born, no datum matured. That is the honest gap an experiment');
console.log('must close: each experiment\'s value = how much it moves Authority Δ / Boundary Δ / Evidence Δ.\n');
