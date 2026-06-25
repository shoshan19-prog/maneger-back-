#!/usr/bin/env node
/**
 * Lint a batch of observations against the Observation Contract BEFORE ingest.
 * Reuses lib/observationContract.js (the same gate the live endpoint will use) and
 * an axes definition, so what passes here is exactly what the system accepts.
 *
 * Usage:
 *   node observation_lint.mjs <observations.json|.csv> [--axes axes.json]
 *
 * observations: array of rows with fields project_id, axis_id, value, unit, method,
 *   uncertainty, replicate_count, conditions{}, provenance{...}, outcome_class.
 * axes: array of {axis_id, canonical_unit, method, is_scalar, noise_floor}.
 *   Defaults to the 5 axes seeded in migration 007 if --axes is omitted.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const axesArg = args.includes('--axes') ? args[args.indexOf('--axes') + 1] : null;
if (!file) { console.error('Usage: node observation_lint.mjs <obs.json|.csv> [--axes axes.json]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { DEFAULT_AXES, axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const axes = axesArg ? JSON.parse(fs.readFileSync(axesArg, 'utf8')) : DEFAULT_AXES;
const axById = axesById(axes);

// load observations (json array or simple csv)
function loadObs(p) {
  const raw = fs.readFileSync(p, 'utf8');
  if (p.endsWith('.json')) { const j = JSON.parse(raw); return Array.isArray(j) ? j : (j.observations || []); }
  const [head, ...lines] = raw.split(/\r?\n/).filter(Boolean);
  const cols = head.split(',').map(s => s.trim());
  return lines.map(l => {
    const cells = l.split(',');
    const o = {}; cols.forEach((c, i) => o[c] = (cells[i] ?? '').trim());
    ['value', 'uncertainty', 'replicate_count'].forEach(k => { if (o[k] !== '' && o[k] != null) o[k] = Number(o[k]); });
    if (o.conditions) try { o.conditions = JSON.parse(o.conditions); } catch (_) {}
    if (o.provenance) try { o.provenance = JSON.parse(o.provenance); } catch (_) {}
    return o;
  });
}

const obs = loadObs(file);
let pass = 0, fail = 0, warn = 0;
console.log(`Linting ${obs.length} observations against the Observation Contract\n`);
obs.forEach((o, i) => {
  const axis = axById[o.axis_id] || null;
  const { valid, errors, warnings } = validateObservation(o, axis);
  if (valid) pass++; else fail++;
  if (warnings.length) warn++;
  if (!valid || warnings.length) {
    console.log(`row ${i} [${o.axis_id || '?'}] ${valid ? 'PASS' : 'FAIL'}`);
    errors.forEach(e => console.log('   ✗ ' + e));
    warnings.forEach(w => console.log('   ⚠ ' + w));
  }
});
console.log(`\nRESULT: ${pass} pass, ${fail} fail, ${warn} with warnings.`);
console.log(fail ? '→ Fix failing rows before ingest (the live endpoint will reject them identically).'
                 : '→ All rows would be accepted by the contract gate.');
process.exit(fail ? 1 : 0);
