#!/usr/bin/env node
/**
 * Build the Product Specification Library (v2) from Fresco sheets (text exports).
 * Usage: node scripts/extract_specs.mjs <file1.txt> [...] [--out config/product_specification_library_v1.json]
 *
 * Emits traceable per-product records + a 4-category Gap List (Fresco):
 *   A Extracted · B Present-but-Non-standard · C External-Required · D Unknown.
 * T_relevance side only — no measurement here.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'config/product_specification_library_v1.json';
const files = args.filter(a => a.endsWith('.txt'));
if (!files.length) { console.error('Usage: node scripts/extract_specs.mjs <file.txt ...> [--out x.json]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { extractSpecs } = await import(pathToFileURL(path.resolve(here, '../lib/specExtract.js')).href);

const products = [];
const A = new Set(), B = new Set(), C = new Set(), D = new Set();
for (const f of files) {
  const r = extractSpecs(fs.readFileSync(f, 'utf8'), path.basename(f, '.txt'), path.basename(f));
  products.push({ ...r, source_file: path.basename(f) });
  for (const ax of Object.keys(r.specification)) A.add(ax);
  for (const g of r.present_non_standard) B.add(`${g.axis}: ${g.reason}`);
  for (const e of r.needs_external_document) C.add(e.axis);
  for (const ax of r.missing) D.add(ax);
}

const lib = {
  registry: 'PRODUCT_SPECIFICATION_LIBRARY',
  version: 'v2',
  source: 'Fresco formulation sheets (Drive: laboratory/), extracted 2026-06-26',
  note: 'T_relevance per product (when a result is "good"). Three-state spec status: Present (in this doc) / External (known, in a QC/spec doc) / Missing. The other half of max(T_noise,T_relevance); T_noise still comes only from measurement.',
  mechanisms: ['docClassify (document type + family)', 'parameterDictionary (label -> canonical axis)', 'unitNormalize (raw -> canonical, traceable)'],
  products,
  gap_list: {
    A_extracted_successfully: [...A],
    B_present_but_non_standard: [...B],
    C_external_specification_required: [...C],
    D_unknown: [...D],
  },
};
fs.writeFileSync(out, JSON.stringify(lib, null, 2) + '\n');
const nSpecs = products.reduce((s, p) => s + Object.keys(p.specification).length, 0);
console.log(`Spec Library v2: ${products.length} products, ${nSpecs} numeric specs`);
console.log(`  Gap: A=${A.size} extracted, B=${B.size} non-standard, C=${C.size} external, D=${D.size} unknown -> ${out}`);
