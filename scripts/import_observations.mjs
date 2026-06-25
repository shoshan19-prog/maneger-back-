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

const { parseObservationsCsv } = await import(pathToFileURL(path.resolve(here, '../lib/observationCsv.js')).href);

const raw = fs.readFileSync(file, 'utf8');
const { observations } = parseObservationsCsv(raw);

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
