#!/usr/bin/env node
/**
 * Reusable formulation / burn-test analyzer for Boundary Intelligence.
 * Codifies the manual analysis done on INTUMESCENT_NEW_FORMULATIONS_*.xlsx:
 *   parse sheets -> find response+input columns -> clean Hebrew/ranges/censored
 *   -> correlations -> thickness normalization -> composite-axis trap check
 *   -> compare deltas vs MME -> Fresco vs competitor split.
 *
 * Usage:  node analyze_formulation.mjs <file.xlsx> [--mme <n>] [--sheet "name"]
 * Needs the `xlsx` package (available in ../matriya-back/node_modules, or `npm i xlsx`).
 */
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let xlsx;
for (const p of ['xlsx', path.resolve(process.cwd(), '../matriya-back/node_modules/xlsx'),
                 path.resolve(process.cwd(), 'node_modules/xlsx')]) {
  try { xlsx = require(p); break; } catch (_) {}
}
if (!xlsx) { console.error('xlsx not found. Run from matriya-back, or `npm i xlsx`.'); process.exit(2); }

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const mme = Number((args[args.indexOf('--mme') + 1]) || NaN);
const onlySheet = args.includes('--sheet') ? args[args.indexOf('--sheet') + 1] : null;
if (!file) { console.error('Usage: node analyze_formulation.mjs <file.xlsx> [--mme n] [--sheet name]'); process.exit(2); }

// --- helpers ---------------------------------------------------------------
const num = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? { val: v, cen: false } : null;
  const s = String(v).trim();
  if (/לא נבדק|לא ניתן|^אין$|^-$|^n\/?a$/i.test(s)) return null;
  const cen = /מעל|>|</.test(s);
  const m = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (!m.length) return null;
  return { val: m.length > 1 ? m.reduce((a, b) => a + b, 0) / m.length : m[0], cen };
};
const pearson = (a, b) => {
  const n = a.length; if (n < 2) return NaN;
  const ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n;
  let p = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { p += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? p / Math.sqrt(da * db) : NaN;
};
const RESP = /expan|expant|התפשט|height|גובה|ttf|failure|כשל|density|צפיפות|char/i;
const INPUT = /app|exolit|loading|thickness|עובי|temp|טמפ|humid|לחות|ph\b/i;

// --- run -------------------------------------------------------------------
const wb = xlsx.readFile(file, { cellDates: true });
console.log('FILE:', path.basename(file));
console.log('SHEETS:', wb.SheetNames.join(' | '));
console.log(mme ? `\nMME (noise floor) supplied: ${mme}` : '\n(no --mme given: deltas vs noise not judged)');

for (const name of wb.SheetNames) {
  if (onlySheet && name !== onlySheet) continue;
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: null, blankrows: false });
  if (rows.length < 2) continue;
  // pick the header row = the row with the most non-empty string cells in first 3 rows
  let hi = 0, best = -1;
  for (let r = 0; r < Math.min(3, rows.length); r++) {
    const c = (rows[r] || []).filter(x => typeof x === 'string' && x.trim()).length;
    if (c > best) { best = c; hi = r; }
  }
  const H = (rows[hi] || []).map(x => x == null ? '' : String(x).trim());
  const respCols = H.map((h, i) => RESP.test(h) ? i : -1).filter(i => i >= 0);
  const inputCols = H.map((h, i) => INPUT.test(h) ? i : -1).filter(i => i >= 0);
  if (!respCols.length) continue;
  console.log(`\n================ SHEET: ${name} (header row ${hi}) ================`);
  console.log('response cols:', respCols.map(i => H[i]).join(', '));
  if (inputCols.length) console.log('input/condition cols:', inputCols.map(i => H[i]).join(', '));

  // build numeric series
  const series = {};
  [...respCols, ...inputCols].forEach(i => series[i] = []);
  for (let r = hi + 1; r < rows.length; r++) {
    [...respCols, ...inputCols].forEach(i => { const v = num((rows[r] || [])[i]); series[i].push(v ? v.val : null); });
  }
  // pairwise correlations response x (response|input)
  console.log('\ncorrelations (n = paired non-nulls):');
  const cols = [...respCols, ...inputCols];
  for (const ri of respCols) for (const ci of cols) {
    if (ci === ri) continue;
    const a = [], b = [];
    for (let k = 0; k < series[ri].length; k++) if (series[ri][k] != null && series[ci][k] != null) { a.push(series[ri][k]); b.push(series[ci][k]); }
    if (a.length >= 3) {
      const r = pearson(a, b);
      console.log(`  ${H[ri]} ~ ${H[ci]} : r=${r.toFixed(3)} (n=${a.length})`);
    }
  }
  // composite-axis trap: response_X ?= response_Y / input_thickness
  const hHt = respCols.find(i => /height|גובה/i.test(H[i]));
  const hThk = [...respCols, ...inputCols].find(i => /thickness|עובי/i.test(H[i]));
  const hExp = respCols.find(i => /expan|expant|התפשט/i.test(H[i]));
  if (hExp != null && hHt != null && hThk != null) {
    let match = 0, tot = 0;
    for (let k = 0; k < series[hExp].length; k++) {
      const e = series[hExp][k], h = series[hHt][k], t = series[hThk][k];
      if (e && h && t) { tot++; const calc = h / (t / 1000); if (Math.abs(calc - e) / e < 0.1) match++; }
    }
    if (tot) console.log(`\n⚠️ COMPOSITE-AXIS CHECK: "${H[hExp]}" ≈ "${H[hHt]}"/"${H[hThk]}" in ${match}/${tot} rows` +
      (match / tot > 0.7 ? ' → NOT a canonical scalar axis (derive, do not store).' : ''));
  }
  // MME judgement on response ranges
  if (mme) {
    for (const ri of respCols) {
      const vals = series[ri].filter(v => v != null);
      if (vals.length >= 2) { const d = Math.max(...vals) - Math.min(...vals);
        console.log(`  range(${H[ri]})=${d.toFixed(2)} vs MME=${mme} → ${d > mme ? 'separable' : 'within noise'}`); }
    }
  }
}

console.log('\n----------------------------------------------------------------');
console.log('NEXT (always): 1) which axis is canonical vs derived?  2) is variation a boundary or a gradient?');
console.log('               3) what is confounded?  4) does this connect to an existing boundary/decision?');
