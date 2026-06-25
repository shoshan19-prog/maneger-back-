#!/usr/bin/env node
/**
 * Import observations from an Excel-friendly CSV (Rachel's data-collection template)
 * into validated, ready-to-POST JSON — the bridge from the lab's spreadsheet to the
 * live /api/observations endpoint. Validates every row through the SAME contract gate
 * (lib/observationContract.js) so what this accepts is exactly what the endpoint accepts.
 *
 * Usage:
 *   node import_observations.mjs <file.csv> [--out payload.json] [--axes axes.json]
 *   (default: dry-run — writes payload.json and prints a summary; does NOT POST.)
 *
 * CSV columns (flat, Excel-friendly):
 *   project_id, experiment_id, material_id, axis_id, value, unit, method,
 *   uncertainty, replicate_count, replicate_group, outcome_class, outcome_spec_ref,
 *   observed_by, observed_at, source_type, source_reference,
 *   cond_<AXIS>_value, cond_<AXIS>_unit   (repeatable per condition, e.g. cond_TEMPERATURE_value)
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'observations_payload.json';
const axesArg = args.includes('--axes') ? args[args.indexOf('--axes') + 1] : null;
if (!file) { console.error('Usage: node import_observations.mjs <file.csv> [--out payload.json]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { DEFAULT_AXES, axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const axById = axesById(axesArg ? JSON.parse(fs.readFileSync(axesArg, 'utf8')) : DEFAULT_AXES);

// minimal CSV parser (handles quoted fields with commas)
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}

const numOrUndef = (v) => (v == null || String(v).trim() === '') ? undefined : Number(v);
const strOrUndef = (v) => (v == null || String(v).trim() === '') ? undefined : String(v).trim();

const raw = fs.readFileSync(file, 'utf8');
const [header, ...lines] = parseCSV(raw);
const cols = header.map(h => h.trim());

const observations = lines.map(cells => {
  const r = {}; cols.forEach((c, i) => r[c] = cells[i]);
  const o = {
    project_id: strOrUndef(r.project_id),
    experiment_id: strOrUndef(r.experiment_id),
    material_id: strOrUndef(r.material_id),
    axis_id: strOrUndef(r.axis_id),
    value: numOrUndef(r.value),
    unit: strOrUndef(r.unit),
    method: strOrUndef(r.method),
    uncertainty: numOrUndef(r.uncertainty),
    replicate_count: numOrUndef(r.replicate_count),
    replicate_group: strOrUndef(r.replicate_group),
    outcome_class: strOrUndef(r.outcome_class),
    outcome_spec_ref: strOrUndef(r.outcome_spec_ref),
    provenance: {
      source_type: strOrUndef(r.source_type),
      source_reference: strOrUndef(r.source_reference),
      observed_by: strOrUndef(r.observed_by),
      observed_at: strOrUndef(r.observed_at),
    },
    conditions: {},
  };
  // condition columns: cond_<AXIS>_value / cond_<AXIS>_unit
  for (const c of cols) {
    const m = c.match(/^cond_(.+)_value$/);
    if (m && strOrUndef(r[c]) !== undefined) {
      const axis = m[1];
      o.conditions[axis] = { value: Number(r[c]), unit: strOrUndef(r[`cond_${axis}_unit`]) || '' };
    }
  }
  return o;
});

// validate all through the contract gate
let pass = 0; const problems = [];
observations.forEach((o, i) => {
  const { valid, errors, warnings } = validateObservation(o, axById[o.axis_id] || null);
  if (valid) pass++; else problems.push({ row: i + 2, errors }); // +2 = header + 1-based
  if (warnings.length) problems.push({ row: i + 2, warnings });
});

console.log(`Parsed ${observations.length} rows from ${path.basename(file)}`);
problems.forEach(p => console.log(`  row ${p.row}:`, JSON.stringify(p.errors || p.warnings)));
const fails = observations.length - pass;
if (fails) {
  console.log(`\n✗ ${fails} row(s) fail the contract — fix before ingest. No payload written.`);
  process.exit(1);
}
fs.writeFileSync(out, JSON.stringify({ observations }, null, 2));
console.log(`\n✓ ${pass} valid observations. Payload written: ${out}`);
console.log(`  To ingest:  curl -X POST <BASE>/api/observations -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' --data @${out}`);
