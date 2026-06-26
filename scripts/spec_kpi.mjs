#!/usr/bin/env node
/**
 * Spec-extraction KPI gate (Fresco): validate the parser on a representative sample BEFORE
 * running on the whole Drive library, so a small parser bug doesn't replicate across hundreds
 * of docs. Usage: node scripts/spec_kpi.mjs <dir-of-txt> | <file.txt ...>
 *
 * These are PROXY KPIs (self-assessed, no human ground-truth labels):
 *   Product detection      = % docs with a non-empty product name
 *   Family classification  = % docs whose family != 'unknown'
 *   Parameter normalization= % numeric specs with a successful unit normalization
 *   False-Missing rate     = % docs that look like they HAVE a QC block but yielded 0 specs
 * Targets: 99 / 98 / 99 / <2. Real KPIs need labeled docs — flagged honestly.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
let files = [];
if (args.length === 1 && fs.existsSync(args[0]) && fs.statSync(args[0]).isDirectory()) {
  files = fs.readdirSync(args[0]).filter(f => f.endsWith('.txt')).map(f => path.join(args[0], f));
} else files = args.filter(a => a.endsWith('.txt'));
if (!files.length) { console.error('Usage: node scripts/spec_kpi.mjs <dir|file.txt ...>'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { extractSpecs } = await import(pathToFileURL(path.resolve(here, '../lib/specExtract.js')).href);

let withProduct = 0, withFamily = 0, normOK = 0, normTotal = 0, falseMissing = 0;
const misses = [];
const xtab = { document_type: {}, family: {}, spec_status: { Present: 0, External: 0, Missing: 0 }, domain: {} };
const bump = (b, k) => { b[k] = (b[k] || 0) + 1; };
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const r = extractSpecs(text, path.basename(f, '.txt'), path.basename(f));
  if (r.product) withProduct++; else misses.push(`no product: ${path.basename(f)}`);
  if (r.family !== 'unknown') withFamily++; else misses.push(`family unknown: ${path.basename(f)}`);
  for (const ax of Object.keys(r.specification)) { normTotal++; if (r.specification[ax].confidence >= 1.0) normOK++; }
  const looksLikeQc = /בדיקות/.test(text) && /(משקל סגולי|PH|אחידות)/i.test(text);
  if (looksLikeQc && Object.keys(r.specification).length === 0) { falseMissing++; misses.push(`false-missing (QC block, 0 specs): ${path.basename(f)}`); }
  // distribution cross-tab (scaffold for the confusion matrix; a true CM needs labeled docs)
  bump(xtab.document_type, r.document_type); bump(xtab.family, r.family);
  xtab.spec_status.Present += Object.keys(r.specification).length;
  xtab.spec_status.External += r.needs_external_document.length;
  xtab.spec_status.Missing += r.missing.length;
  for (const ax of Object.keys(r.specification)) bump(xtab.domain, r.specification[ax].classification.domain);
}
const n = files.length;
const pct = (x, d) => d ? (100 * x / d).toFixed(1) : 'n/a';
const row = (label, val, target) => `  ${label.padEnd(26)} ${String(val + '%').padStart(7)}   target ${target}`;
console.log(`\nSpec KPI gate — ${n} documents (PROXY metrics; real KPIs need labeled docs)\n`);
console.log(row('Product detection', pct(withProduct, n), '>99%'));
console.log(row('Family classification', pct(withFamily, n), '>98%'));
console.log(row('Parameter normalization', pct(normOK, normTotal), '>99%'));
console.log(row('False-Missing rate', pct(falseMissing, n), '<2%'));
if (misses.length) { console.log('\nFlags:'); misses.forEach(m => console.log('  - ' + m)); }
console.log('\nDistribution (cross-tab; true confusion matrix needs labeled docs):');
for (const [dim, counts] of Object.entries(xtab)) {
  console.log(`  ${dim}: ${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
}
const gate = Number(pct(withProduct, n)) >= 99 && Number(pct(withFamily, n)) >= 98 && Number(pct(normOK, normTotal || 1)) >= 99 && Number(pct(falseMissing, n)) < 2;
console.log(`\nGate: ${gate ? 'PASS — justified to run on the full library' : 'NOT PASS — fix before scaling'}\n`);
