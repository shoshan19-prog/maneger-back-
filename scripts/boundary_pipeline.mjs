#!/usr/bin/env node
// One command: CSV -> import/lint (contract) -> gate_b_dry_run report.
// Usage: node boundary_pipeline.mjs <csv> [--input density] [--spec 60]
import { spawnSync } from 'child_process';
import path from 'path'; import os from 'os';
const here = path.dirname(new URL(import.meta.url).pathname);
const csv = process.argv[2];
if (!csv) { console.error('Usage: node boundary_pipeline.mjs <csv> [--input density] [--spec 60]'); process.exit(2); }
const rest = process.argv.slice(3);
const payload = path.join(os.tmpdir(), 'boundary_payload.json');
const run = (a) => { const r = spawnSync('node', a, { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
console.log('— step 1: import + contract lint —');
run([path.join(here, 'import_observations.mjs'), csv, '--out', payload]);
console.log('\n— step 2: derive boundary + report —');
run([path.join(here, 'gate_b_dry_run.mjs'), payload, ...rest]);
