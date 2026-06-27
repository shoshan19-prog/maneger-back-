#!/usr/bin/env node
/**
 * Extract structured formulas from the corpus formula sheets into .corpus/formulas_v1.json.
 * The output is PROPRIETARY (real Fresco compositions) → it lives under .corpus/ (git-ignored).
 * The code here is generic and safe to commit; the data it produces is not.
 *
 * This is the first genuine Knowledge-Δ-from-data-in-hand: 8 real formulas (incl. PSD design,
 * David's identity variable) extracted from documents we already have — no David, no Rachel.
 *
 * Usage: node scripts/extract_formulas.mjs [--dir .corpus/specsrc] [--out .corpus/formulas_v1.json]
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const arg = (k, d) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d;
const dir = path.resolve(arg('--dir', '.corpus/specsrc'));
const out = path.resolve(arg('--out', '.corpus/formulas_v1.json'));

const here = path.dirname(new URL(import.meta.url).pathname);
const { extractFormula } = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);

const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort();
const formulas = files.map(f => {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  return { source_file: f, ...extractFormula(text, path.basename(f, '.txt')) };
});

fs.writeFileSync(out, JSON.stringify({
  note: 'Structured formulas extracted from .corpus/specsrc (Layer-1 objective row facts). PROPRIETARY — git-ignored. Roles (binder/psd_fraction/additive) are provisional heuristics, not asserted knowledge.',
  generated_from: path.relative(path.resolve(here, '..'), dir),
  count: formulas.length,
  formulas,
}, null, 2) + '\n');

// Summary to stdout (counts only — no proprietary composition leaks to the terminal/log).
const totIng = formulas.reduce((s, r) => s + r.ingredient_count, 0);
const totPsd = formulas.reduce((s, r) => s + r.psd_design.length, 0);
const okPct = formulas.filter(r => r.percent_ok).length;
console.log(`\nFormula extraction → ${path.relative(path.resolve(here, '..'), out)}`);
console.log(`  formulas: ${formulas.length}  ·  ingredients: ${totIng}  ·  PSD fractions (identity): ${totPsd}`);
console.log(`  percent self-audit OK (sum≈100): ${okPct}/${formulas.length}`);
console.log('\n  per formula:');
for (const r of formulas) {
  const flag = r.percent_ok ? '✓' : '⚠';
  console.log(`  ${flag} ${r.source_file.padEnd(34)} ${String(r.ingredient_count).padStart(2)} ing · ${r.binders.length} binder · ${r.psd_design.length} PSD · Σ%=${r.percent_sum}`);
}
console.log('');
