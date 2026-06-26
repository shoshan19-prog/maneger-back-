#!/usr/bin/env node
/**
 * Build the Product Specification Library from Fresco formulation sheets (text exports).
 * Usage: node scripts/extract_specs.mjs <file1.txt> [file2.txt ...] [--out config/product_specification_library_v1.json]
 *
 * Each .txt is the text representation of one workbook (one or more products). Runs the
 * shared extractor (lib/specExtract.js), emits Spec Library + a Gap List (the third output
 * of the unified-parser idea). T_relevance side only — no measurement here.
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
const gapSet = new Set();
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const r = extractSpecs(text, path.basename(f, '.txt'));
  products.push({ product: r.product, source_file: path.basename(f), specs: r.specs,
    declared_empty: r.declared_empty, qualitative_gaps: r.qualitative_gaps });
  r.qualitative_gaps.forEach(g => gapSet.add(`qualitative axis with no numeric scale: ${g}`));
  r.declared_empty.forEach(g => gapSet.add(`QC row present but no range filled: ${g}`));
  if (r.specs.some(s => s.axis === 'density')) gapSet.add('density spec in g/cm3 vs canonical kg/m3 — convert x1000 (commensurability)');
}

const lib = {
  registry: 'PRODUCT_SPECIFICATION_LIBRARY',
  version: 'v1',
  source: 'Fresco formulation sheets QC blocks (Drive: laboratory/), extracted 2026-06-26',
  note: 'T_relevance per product: when is a result "good". The other half of the decision boundary (max(T_noise, T_relevance)); T_noise still comes only from measurement. Numeric ranges where the sheet filled them; qualitative checks listed as gaps.',
  products,
  gap_list: [...gapSet],
};
fs.writeFileSync(out, JSON.stringify(lib, null, 2) + '\n');
const nSpecs = products.reduce((s, p) => s + p.specs.length, 0);
console.log(`Spec Library: ${products.length} products, ${nSpecs} numeric specs, ${lib.gap_list.length} gap types -> ${out}`);
