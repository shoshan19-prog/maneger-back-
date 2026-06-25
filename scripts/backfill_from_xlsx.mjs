#!/usr/bin/env node
/**
 * Backfill observations from the historical burn-test xlsx (Phase A7).
 * Turns real existing data into validated, contract-shaped observations —
 * CHAR_HEIGHT and TIME_TO_FAILURE per sample, with FILM_THICKNESS as a condition.
 *
 * Honest by design: historical rows have NO outcome_class (the Works/Fails spec is
 * Rachel's) and NO per-row uncertainty -> they pass the contract WITH WARNINGS, i.e.
 * captured but flagged "not boundary-grade until spec+uncertainty exist".
 *
 * Usage:
 *   node backfill_from_xlsx.mjs <file.xlsx> [--project <uuid>] [--out payload.json]
 * Needs the xlsx package (../matriya-back/node_modules or `npm i xlsx`).
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const require = createRequire(import.meta.url);
let xlsx;
for (const p of ['xlsx', path.resolve(process.cwd(), '../matriya-back/node_modules/xlsx'),
                 path.resolve(process.cwd(), 'node_modules/xlsx')]) { try { xlsx = require(p); break; } catch (_) {} }
if (!xlsx) { console.error('xlsx not found (run from matriya-back or `npm i xlsx`).'); process.exit(2); }

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const project = args.includes('--project') ? args[args.indexOf('--project') + 1] : 'HISTORICAL_PROJECT_UUID';
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'backfill_payload.json';
if (!file) { console.error('Usage: node backfill_from_xlsx.mjs <file.xlsx> [--project uuid] [--out payload.json]'); process.exit(2); }

const here = path.dirname(new URL(import.meta.url).pathname);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const axById = axesById();

const num = (v) => { if (v == null) return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim(); if (/לא נבדק|לא ניתן|^אין$|^-$/.test(s)) return null;
  const m = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number); if (!m.length) return null;
  return m.length > 1 ? m.reduce((a, b) => a + b, 0) / m.length : m[0]; };
const str = (v) => (v == null || String(v).trim() === '') ? null : String(v).trim();

const wb = xlsx.readFile(file, { cellDates: true });
const SHEET = 'בדיקת שריפה -פורמולציות מבוקרות';
const rows = xlsx.utils.sheet_to_json(wb.Sheets[SHEET], { header: 1, defval: null, blankrows: false });
// columns (from analysis): 8 Expansion, 9 height, 10 ttf, 14 thickness(micron), 19 formulation, 20 experiment id, 21 burn date
const observations = [];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r]; if (!row) continue;
  const height = num(row[9]), ttf = num(row[10]), thk = num(row[14]);
  const formulation = str(row[19]), expId = str(row[20]), burnDate = str(row[21]);
  if (height == null && ttf == null) continue;
  const conditions = {};
  if (thk != null) conditions.FILM_THICKNESS = { value: thk, unit: 'micron' };
  if (formulation) conditions.formulation = { value: formulation }; // free context (capture wide)
  const baseProv = { source_type: 'historical_backfill',
    source_reference: [formulation, expId].filter(Boolean).join('/') || 'xlsx_row_' + r,
    observed_by: 'lab_historical', observed_at: burnDate || 'historical' };
  const mk = (axis_id, value, unit, method) => ({
    project_id: project, axis_id, value, unit, method,
    replicate_count: 1, conditions, provenance: baseProv,
    // no outcome_class (spec is Rachel's), no uncertainty (not recorded) -> flagged by contract
  });
  if (height != null) observations.push(mk('CHAR_HEIGHT', height, 'mm', 'iso834_furnace_burn'));
  if (ttf != null) observations.push(mk('TIME_TO_FAILURE', ttf, 'min', 'iso834_to_500C'));
}

let pass = 0, warnRows = 0;
observations.forEach(o => { const { valid, warnings } = validateObservation(o, axById[o.axis_id] || null);
  if (valid) pass++; if (warnings.length) warnRows++; });
fs.writeFileSync(out, JSON.stringify({ observations }, null, 2));
console.log(`Backfilled ${observations.length} observations from "${SHEET}"`);
console.log(`  ${pass} pass the contract, ${warnRows} carry warnings (missing uncertainty/outcome — historical, not boundary-grade).`);
console.log(`  project_id placeholder = "${project}" — replace with a real project UUID before POST.`);
console.log(`  payload: ${out}`);
