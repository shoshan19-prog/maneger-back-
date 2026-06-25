/**
 * Tests for the shared lab-CSV parser. Run: node tests/observationCsv.test.mjs
 * This parser is the single source used by scripts/import_observations.mjs, the
 * POST /api/observations/import-csv endpoint, and the dashboard Ingest button —
 * so locking its column→observation mapping locks all three at once.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { parseCSV, parseObservationsCsv } = await import(pathToFileURL(path.resolve(here, '../lib/observationCsv.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const CSV = [
  'project_id,axis_id,value,unit,method,replicate_count,outcome_class,observed_by,source_type,cond_density_value,cond_density_unit',
  'FIRE_RETARDANT_PLASTER,time_to_failure,80,min,EN 13381-8,3,works,Rachel,lab_measurement,140,kg/m3',
  'FIRE_RETARDANT_PLASTER,time_to_failure,50,min,EN 13381-8,3,fails,Rachel,lab_measurement,90,kg/m3',
].join('\n');

t('parseCSV handles quoted fields with embedded commas', () => {
  const rows = parseCSV('a,b\n"x,y",2');
  assert.deepEqual(rows[1], ['x,y', '2']);
});

t('parseCSV drops fully-blank lines', () => {
  const rows = parseCSV('a,b\n1,2\n\n3,4\n');
  assert.equal(rows.length, 3); // header + 2 data rows
});

t('maps flat columns to a contract-shaped observation', () => {
  const { observations } = parseObservationsCsv(CSV);
  assert.equal(observations.length, 2);
  const o = observations[0];
  assert.equal(o.project_id, 'FIRE_RETARDANT_PLASTER');
  assert.equal(o.axis_id, 'time_to_failure');
  assert.strictEqual(o.value, 80);                 // numeric coercion
  assert.strictEqual(o.replicate_count, 3);
  assert.equal(o.outcome_class, 'works');
});

t('lifts cond_<AXIS>_value/_unit into conditions', () => {
  const { observations } = parseObservationsCsv(CSV);
  assert.deepEqual(observations[0].conditions, { density: { value: 140, unit: 'kg/m3' } });
  assert.deepEqual(observations[1].conditions, { density: { value: 90, unit: 'kg/m3' } });
});

t('nests provenance from source_/observed_ columns', () => {
  const { observations } = parseObservationsCsv(CSV);
  assert.equal(observations[0].provenance.observed_by, 'Rachel');
  assert.equal(observations[0].provenance.source_type, 'lab_measurement');
});

t('empty / header-only input yields no observations', () => {
  assert.deepEqual(parseObservationsCsv('').observations, []);
  assert.deepEqual(parseObservationsCsv('project_id,axis_id,value').observations, []);
});

console.log(`\n${passed} passed`);
