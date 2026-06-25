#!/usr/bin/env node
/**
 * E-012 converter — turn Rachel's wide, lab-friendly E-012 sheet (one row per sample)
 * into the long observation CSV the Ingest button / contract expect (one row per axis).
 *
 * Rachel fills docs/E-012-template.csv naturally (sample-centric). This expands each sample
 * into its measured observations (char_density, char_integrity→char_quality, time_to_failure),
 * each carrying the SHARED measurement context as conditions (initial_film_thickness,
 * exposed_area, burn_profile, sample_age, char_height), and validates every row through the
 * SAME gate (lib/observationContract.js). Output uploads as-is via the Ingest button.
 *
 * Usage: node scripts/e012_to_observations.mjs <wide.csv> [--out e012_observations.csv]
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'e012_observations.csv';
if (!file) { console.error('Usage: node scripts/e012_to_observations.mjs <wide.csv> [--out file.csv]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { e012ToObservations } = await import(pathToFileURL(path.resolve(here, '../lib/e012Convert.js')).href);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const AX = axesById();

const { observations, samples } = e012ToObservations(fs.readFileSync(file, 'utf8'));

// Validate through the same contract gate (warnings are allowed; errors block).
let pass = 0; const problems = [];
observations.forEach((o, i) => {
  const { valid, errors } = validateObservation(o, AX[o.axis_id] || null);
  if (valid) pass++; else problems.push({ row: i + 1, axis: o.axis_id, errors });
});
console.log(`E-012: ${samples} samples -> ${observations.length} observations (${pass} valid)`);
problems.forEach(p => console.log(`  obs ${p.row} [${p.axis}]:`, p.errors.join('; ')));
if (pass < observations.length) {
  console.log(`\n✗ ${observations.length - pass} observation(s) fail the contract — fix before ingest. No file written.`);
  process.exit(1);
}

// Emit the long observation CSV (columns the Ingest button / parseObservationsCsv understand).
const condKeys = [...new Set(observations.flatMap(o => Object.keys(o.conditions)))];
const cols = ['project_id', 'experiment_id', 'replicate_group', 'axis_id', 'value', 'unit', 'method',
  'observed_by', 'observed_at', 'source_type', 'source_reference',
  ...condKeys.flatMap(k => [`cond_${k}_value`, `cond_${k}_unit`])];
const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const lines = [cols.join(',')];
for (const o of observations) {
  const base = { ...o, ...o.provenance };
  const cells = cols.map(c => {
    const cm = c.match(/^cond_(.+)_(value|unit)$/);
    if (cm) { const cc = o.conditions[cm[1]]; return esc(cc ? cc[cm[2]] : ''); }
    return esc(base[c]);
  });
  lines.push(cells.join(','));
}
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log(`\n✓ ${pass} observations written: ${out}`);
console.log(`  Upload via the dashboard Ingest button (or: node scripts/import_observations.mjs ${out}).`);
