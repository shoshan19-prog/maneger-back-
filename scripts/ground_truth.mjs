#!/usr/bin/env node
/**
 * Ground Truth harness (Fresco K-step): measure the parser against human-confirmed labels,
 * not against itself. Two modes:
 *
 *   skeleton  — run the extractor over the corpus and write .corpus/ground_truth.json with
 *               truth PRE-FILLED from predictions + confirmed:false. A human then CORRECTS the
 *               `truth` fields and flips confirmed:true. (Won't overwrite an edited file
 *               unless --force.)
 *   score     — re-run the extractor and compare to the confirmed truth → confusion matrices
 *               (document_type, family) + spec precision/recall + product accuracy.
 *
 * Usage: node scripts/ground_truth.mjs skeleton|score [--dir .corpus/specsrc] [--gt .corpus/ground_truth.json] [--force]
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const mode = process.argv[2];
const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const dir = path.resolve(arg('--dir', '.corpus/specsrc'));
const gtPath = path.resolve(arg('--gt', '.corpus/ground_truth.json'));
const force = process.argv.includes('--force');
if (!['skeleton', 'score'].includes(mode)) { console.error('Usage: ground_truth.mjs skeleton|score'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { extractSpecs } = await import(pathToFileURL(path.resolve(here, '../lib/specExtract.js')).href);

const predictOf = (file) => {
  const r = extractSpecs(fs.readFileSync(file, 'utf8'), path.basename(file, '.txt'), path.basename(file));
  const specs = {};
  for (const [ax, s] of Object.entries(r.specification)) specs[ax] = { min: s.value.min, max: s.value.max, unit: s.value.unit };
  return { document_type: r.document_type, family: r.family, product: r.product, specs };
};
const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort().map(f => path.join(dir, f));

if (mode === 'skeleton') {
  if (fs.existsSync(gtPath) && !force) { console.error(`refusing to overwrite ${path.relative(process.cwd(), gtPath)} (use --force)`); process.exit(1); }
  const docs = files.map(f => { const p = predictOf(f); return { source_file: path.basename(f), predicted: p, truth: JSON.parse(JSON.stringify(p)), confirmed: false }; });
  fs.writeFileSync(gtPath, JSON.stringify({ note: 'CORRECT each `truth` then set confirmed:true. `predicted` is frozen for reference.', docs }, null, 2) + '\n');
  console.log(`Ground-Truth skeleton: ${docs.length} docs -> ${path.relative(process.cwd(), gtPath)}`);
  console.log('Next: edit truth fields, flip confirmed:true, then: node scripts/ground_truth.mjs score');
  process.exit(0);
}

// score
const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
const confirmed = gt.docs.filter(d => d.confirmed);
console.log(`\nGround-Truth score — ${confirmed.length}/${gt.docs.length} docs confirmed`);
if (!confirmed.length) { console.log('No confirmed labels yet — correct truth + set confirmed:true first. (Scoring against unconfirmed = parser vs itself = meaningless.)\n'); process.exit(0); }

const cm = { document_type: {}, family: {} };
const add = (m, truth, pred) => { const k = `${truth} → ${pred}`; m[k] = (m[k] || 0) + 1; };
let pName = 0, tp = 0, fp = 0, fn = 0, valOK = 0;
for (const d of confirmed) {
  const pred = predictOf(path.join(dir, d.source_file));
  add(cm.document_type, d.truth.document_type, pred.document_type);
  add(cm.family, d.truth.family, pred.family);
  if (d.truth.product === pred.product) pName++;
  const T = d.truth.specs || {}, P = pred.specs || {};
  for (const ax of Object.keys(P)) { if (T[ax]) { tp++; if (T[ax].min === P[ax].min && T[ax].max === P[ax].max && T[ax].unit === P[ax].unit) valOK++; } else fp++; }
  for (const ax of Object.keys(T)) if (!P[ax]) fn++;
}
const pct = (x, d) => d ? (100 * x / d).toFixed(1) + '%' : 'n/a';
const showCM = (name, m) => { console.log(`\nConfusion — ${name} (truth → predicted):`); Object.entries(m).forEach(([k, v]) => console.log(`  ${k}: ${v}`)); };
showCM('document_type', cm.document_type);
showCM('family', cm.family);
console.log('\nSpecs:');
console.log(`  precision: ${pct(tp, tp + fp)}  recall: ${pct(tp, tp + fn)}  value-exact: ${pct(valOK, tp)}  (TP=${tp} FP=${fp} FN=${fn})`);
console.log(`  product-name accuracy: ${pct(pName, confirmed.length)}\n`);
