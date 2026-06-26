#!/usr/bin/env node
/**
 * Ground Truth harness — TWO layers (Fresco):
 *   Layer 1  objective facts, read from the document itself (near-mechanical): product,
 *            family, document_type, version/date, parameters present (+units). Auto-filled.
 *   Layer 2  professional knowledge, confirmed by Rachel: is this the official doc? is a spec
 *            truly missing? External vs Not-Expected? does the parameter belong to the family?
 *            is there an alternative document? Left pending — the lab fills it.
 * Plus validation provenance: validated_by / validation_date / confidence (verified|provisional).
 *
 * Modes:
 *   skeleton — auto-fill Layer 1 from the corpus; leave Layer 2 + validation pending.
 *   score    — compare the parser to Layer 1 (objective) → product/family/document_type
 *              accuracy + spec recall/precision vs parameters-present. Layer 2 scored when filled.
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
if (!['skeleton', 'sheet', 'merge', 'score'].includes(mode)) { console.error('Usage: ground_truth.mjs skeleton|sheet|merge|score'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const imp = (p) => import(pathToFileURL(path.resolve(here, '../lib/' + p)).href);
const { extractSpecs } = await imp('specExtract.js');
const { classify } = await imp('docClassify.js');
const { PARAMETERS } = await imp('parameterDictionary.js');

const dateOf = (t) => { const m = t.match(/(?:תאריך|מס'?\s*מנה|מספר\s*מנה)\s*[:,]?\s*([0-9][0-9.\/-]{5,})/); return m ? m[1] : null; };
const productOf = (t) => { const m = t.match(/שם\s*ה?מוצר[ ,]+([^,\n]+?)\s*(?:,|\n|$)/); return m ? m[1].trim() : ''; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (alias, t) => new RegExp(esc(alias), 'i').test(t);
const hasValue = (alias, t) => new RegExp(esc(alias) + '[^\\d\\n]{0,12}([\\d.]+)\\s*-\\s*([\\d.]+)', 'i').test(t);

// Layer 1 — objective, from the document. We separate:
//   parameters_present  — the QC row/label appears (near-mechanical)
//   values_present      — a numeric range is actually filled (the fair target for parser recall)
// The gap between them (declared-but-empty) is what Layer 2 / Rachel judges: real-missing vs External.
function layer1(text) {
  const doc = classify(text);
  const parameters_present = [], values_present = [];
  for (const p of PARAMETERS) {
    const present = p.aliases.some(a => mentions(a, text));
    if (!present) continue;
    parameters_present.push({ axis: p.axis, kind: p.kind, unit: p.kind === 'numeric' ? p.canonical_unit : null });
    if (p.kind === 'numeric' && p.aliases.some(a => hasValue(a, text))) values_present.push(p.axis);
  }
  return { product: productOf(text), family: doc.family, document_type: doc.document_type, version_date: dateOf(text), parameters_present, values_present };
}

// Layer 2 — the lab's professional judgment (Rachel). Includes Fresco's three context fields.
const layer2Blank = () => ({
  official_source: null,        // yes/no — official doc, or a copy/draft?  (Fresco)
  superseded_by: null,          // newer version, if any                   (Fresco)
  missing_real_spec: null,      // yes/no — is a spec truly missing?
  external_vs_not_expected: null, // External | NotExpected — for empty rows
  parameter_belongs_to_family: null, // yes/no/notes
  alternative_document: null,   // where the spec actually lives
  comments: null,               // free text for exceptions / doubt        (Fresco)
});

// The Rachel-facing columns of the validation sheet (Layer 2 order).
const L2_COLS = ['official_source', 'superseded_by', 'missing_real_spec', 'external_vs_not_expected', 'parameter_belongs_to_family', 'alternative_document', 'comments'];
// Authority / ownership (Fresco): two kinds of authority over a document.
//   Document Authority = official_source + superseded_by (which version is canonical).
//   Domain Authority    = owner / created_by / validated_by (who knows/decides about it).
// Preserved per-document so future knowledge from other people keeps its organizational context.
const OWN_COLS = ['owner', 'created_by', 'validated_by'];
const defaultOwner = arg('--owner', 'Rachel');
const csvCell = (v) => { const s = v == null ? '' : Array.isArray(v) ? v.join('|') : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

const predictOf = (text, file) => {
  const r = extractSpecs(text, path.basename(file, '.txt'), path.basename(file));
  const specs = {};
  for (const [ax, s] of Object.entries(r.specification)) specs[ax] = { min: s.value.min, max: s.value.max, unit: s.value.unit };
  return { document_type: r.document_type, family: r.family, product: r.product, specs };
};

const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort().map(f => path.join(dir, f));

if (mode === 'skeleton') {
  if (fs.existsSync(gtPath) && !force) { console.error(`refusing to overwrite ${path.relative(process.cwd(), gtPath)} (use --force)`); process.exit(1); }
  const docs = files.map(f => {
    const text = fs.readFileSync(f, 'utf8');
    return {
      source_file: path.basename(f),
      layer1_objective: layer1(text),                 // auto-filled (verifiable from the doc)
      layer2_professional: layer2Blank(),             // Rachel (professional judgment)
      ownership: { owner: defaultOwner, created_by: null, validated_by: null }, // Domain Authority
      predicted: predictOf(text, f),                  // frozen parser reference
      validation: { validated_by: null, validation_date: null, confidence: 'provisional' },
    };
  });
  fs.writeFileSync(gtPath, JSON.stringify({
    note: 'Layer 1 auto-filled from the document (objective). Layer 2 + validation = Rachel. Set validation.confidence=verified once she confirms.',
    docs,
  }, null, 2) + '\n');
  console.log(`Ground-Truth skeleton (2-layer): ${docs.length} docs -> ${path.relative(process.cwd(), gtPath)}`);
  console.log('Layer 1 (objective) auto-filled. Next: Rachel fills Layer 2 + flips validation.confidence=verified, then: ground_truth.mjs score');
  process.exit(0);
}

if (mode === 'sheet') {
  // Export a flat validation interface for Rachel: Layer-1 facts (read-only reference) +
  // blank Layer-2 columns to confirm. Excel-friendly CSV.
  const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
  const out = arg('--out', '.corpus/ground_truth_sheet.csv');
  const refCols = ['source_file', 'product', 'family', 'document_type', 'version_date', 'values_present', 'parameters_present'];
  const header = [...refCols, ...L2_COLS, ...OWN_COLS];
  const lines = [header.join(',')];
  for (const d of gt.docs) {
    const L1 = d.layer1_objective, L2 = d.layer2_professional || {}, OWN = d.ownership || {};
    const ref = {
      source_file: d.source_file, product: L1.product, family: L1.family, document_type: L1.document_type,
      version_date: L1.version_date, values_present: (L1.values_present || []),
      parameters_present: (L1.parameters_present || []).map(p => p.axis),
    };
    const row = [...refCols.map(c => csvCell(ref[c])), ...L2_COLS.map(c => csvCell(L2[c])), ...OWN_COLS.map(c => csvCell(OWN[c]))];
    lines.push(row.join(','));
  }
  fs.writeFileSync(path.resolve(out), lines.join('\n') + '\n');
  console.log(`Validation sheet (for Rachel) -> ${out}`);
  console.log('She fills official_source / superseded_by / missing_real_spec / external_vs_not_expected / parameter_belongs_to_family / alternative_document / comments + validated_by, then: ground_truth.mjs merge');
  process.exit(0);
}

if (mode === 'merge') {
  // Merge Rachel's filled sheet back into Layer 2 → Gold Standard Dataset v1.
  const sheet = arg('--sheet', '.corpus/ground_truth_sheet.csv');
  const out = arg('--out', '.corpus/gold_standard_v1.json');
  const valDate = arg('--date', null);
  const { parseCSV } = await imp('observationCsv.js');
  const rows = parseCSV(fs.readFileSync(path.resolve(sheet), 'utf8'));
  const header = rows.shift().map(h => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
  const byFile = Object.fromEntries(gt.docs.map(d => [d.source_file, d]));
  let verified = 0;
  for (const cells of rows) {
    const sf = (cells[idx.source_file] || '').trim();
    const d = byFile[sf]; if (!d) continue;
    d.layer2_professional = d.layer2_professional || layer2Blank();
    for (const c of L2_COLS) if (idx[c] != null) { const v = (cells[idx[c]] || '').trim(); d.layer2_professional[c] = v === '' ? null : v; }
    d.ownership = d.ownership || { owner: defaultOwner, created_by: null, validated_by: null };
    for (const c of OWN_COLS) if (idx[c] != null) { const v = (cells[idx[c]] || '').trim(); if (v !== '') d.ownership[c] = v; }
    const by = d.ownership.validated_by || '';
    const complete = (d.layer2_professional.official_source || '').toString().trim() !== '';
    d.validation = { validated_by: by || (complete ? d.ownership.owner : null), validation_date: valDate, confidence: complete ? 'verified' : 'provisional' };
    if (complete) verified++;
  }
  fs.writeFileSync(path.resolve(out), JSON.stringify({ note: 'Gold Standard Dataset v1 — Layer 1 objective + Layer 2 (Rachel). confidence=verified once official_source is set.', docs: gt.docs }, null, 2) + '\n');
  console.log(`Gold Standard merged: ${verified}/${gt.docs.length} verified -> ${out}`);
  console.log(verified ? 'Run: ground_truth.mjs score --gt ' + out : 'No rows verified — fill official_source in the sheet first.');
  process.exit(0);
}

// score — parser vs Layer 1 (objective)
const gt = JSON.parse(fs.readFileSync(gtPath, 'utf8'));
const verified = gt.docs.filter(d => d.validation && d.validation.confidence === 'verified');
const scope = verified.length ? verified : gt.docs;
console.log(`\nGround-Truth score — ${verified.length}/${gt.docs.length} verified${verified.length ? '' : ' (none verified yet → scoring Layer-1 objective as provisional)'}`);

const cm = { document_type: {}, family: {} };
const add = (m, a, b) => { const k = `${a} → ${b}`; m[k] = (m[k] || 0) + 1; };
let pName = 0, tp = 0, fp = 0, fn = 0;
for (const d of scope) {
  const pred = predictOf(fs.readFileSync(path.join(dir, d.source_file), 'utf8'), d.source_file);
  const L1 = d.layer1_objective;
  add(cm.document_type, L1.document_type, pred.document_type);
  add(cm.family, L1.family, pred.family);
  if (L1.product === pred.product) pName++;
  // Fair recall: parser-extracted vs values ACTUALLY present (not empty rows).
  const valuesPresent = new Set(L1.values_present || []);
  const got = new Set(Object.keys(pred.specs));
  for (const ax of got) (valuesPresent.has(ax) ? tp++ : fp++);
  for (const ax of valuesPresent) if (!got.has(ax)) fn++;
  // doc completeness (a property of the document, not a parser error)
  d._params = (L1.parameters_present || []).filter(p => p.kind === 'numeric').length;
  d._values = valuesPresent.size;
}
const totParams = scope.reduce((s, d) => s + (d._params || 0), 0);
const totValues = scope.reduce((s, d) => s + (d._values || 0), 0);
const pct = (x, d) => d ? (100 * x / d).toFixed(1) + '%' : 'n/a';
const showCM = (n, m) => { console.log(`\nConfusion — ${n} (Layer1 → predicted):`); Object.entries(m).forEach(([k, v]) => console.log(`  ${k}: ${v}`)); };
showCM('document_type', cm.document_type);
showCM('family', cm.family);
console.log('\nSpecs vs values-present (parser correctness):');
console.log(`  recall: ${pct(tp, tp + fn)}  precision: ${pct(tp, tp + fp)}  (TP=${tp} FP=${fp} FN=${fn})`);
console.log(`  product-name accuracy: ${pct(pName, scope.length)}`);
console.log(`\nDoc completeness (filled values / QC rows present): ${pct(totValues, totParams)}  — a doc property, Layer-2 judges real-missing vs External`);
console.log(verified.length ? '' : '\nNote: Layer-2 professional checks (official doc? real-missing? External vs Not-Expected?) await Rachel — not scored yet.\n');
