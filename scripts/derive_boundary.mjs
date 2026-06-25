#!/usr/bin/env node
/**
 * Derive a boundary from an observations payload (LAW-BOUNDARY-001: derive, don't store).
 *
 * Usage:
 *   node derive_boundary.mjs <payload.json> --input <AXIS_in_conditions> --mme <n>
 *
 * Reads observations (the contract payload shape), uses each observation's response
 * value (its axis_id) and the chosen INPUT axis from its conditions, plus outcome_class,
 * then locates the Works->Fails boundary and its uncertainty.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const inputAxis = args.includes('--input') ? args[args.indexOf('--input') + 1] : null;
const mme = args.includes('--mme') ? Number(args[args.indexOf('--mme') + 1]) : undefined;
if (!file || !inputAxis) { console.error('Usage: node derive_boundary.mjs <payload.json> --input <AXIS> [--mme n]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { deriveBoundary } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryDerive.js')).href);

const j = JSON.parse(fs.readFileSync(file, 'utf8'));
const obs = Array.isArray(j) ? j : (j.observations || []);
const points = obs.map(o => ({
  input: Number(o.conditions?.[inputAxis]?.value),
  response: Number(o.value),
  outcome: o.outcome_class,
})).filter(p => Number.isFinite(p.input) && Number.isFinite(p.response) && p.outcome);

console.log(`derive boundary: response=${obs[0]?.axis_id || '?'}  input=${inputAxis}  points=${points.length}  mme=${mme ?? '—'}`);
const result = deriveBoundary(points, { mme });
console.log(JSON.stringify(result, null, 2));
