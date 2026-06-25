/**
 * Tests for the E-012 wide→long mapping. Run: node tests/e012Convert.test.mjs
 * Validates the converted observations through the REAL contract gate, so this proves the
 * E-012 template reaches the Ingest button cleanly (template → observations → contract).
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { e012ToObservations } = await import(pathToFileURL(path.resolve(here, '../lib/e012Convert.js')).href);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const AX = axesById();

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const CSV = [
  'sample_id,formulation_id,variable_changed,variable_level,char_height_mm,char_density_kg_m3,char_integrity_score,time_to_failure_min,initial_film_thickness,exposed_area,burn_profile,sample_age,protocol_version,operator,date,notes',
  'E012-001,INT-TFX-BASE,PER,8,32,78,2,42,800,100,500,7,v1.0,Rachel,2026-06-26,low PER',
  'E012-002,INT-TFX-BASE,PER,14,28,118,4,63,800,100,500,7,v1.0,Rachel,2026-06-26,',
].join('\n');

const { observations, samples } = e012ToObservations(CSV);

t('one sample row expands to 3 observations (density, integrity, time)', () => {
  assert.equal(samples, 2);
  assert.equal(observations.length, 6);
  const first = observations.slice(0, 3).map(o => o.axis_id);
  assert.deepEqual(first, ['char_density', 'char_quality', 'time_to_failure']);
});

t('shared measurement context is carried as conditions (incl. char_height)', () => {
  const cd = observations.find(o => o.axis_id === 'char_density');
  assert.deepEqual(cd.conditions.initial_film_thickness, { value: 800, unit: 'micron' });
  assert.deepEqual(cd.conditions.exposed_area, { value: 100, unit: 'cm2' });
  assert.deepEqual(cd.conditions.burn_profile, { value: 500, unit: 'C' });
  assert.deepEqual(cd.conditions.sample_age, { value: 7, unit: 'days' });
  assert.deepEqual(cd.conditions.char_height, { value: 32, unit: 'mm' });   // captured, not dropped
});

t('provenance encodes the series (formulation + varied component)', () => {
  const o = observations[0];
  assert.equal(o.provenance.observed_by, 'Rachel');
  assert.equal(o.provenance.source_reference, 'E-012:INT-TFX-BASE:PER=8');
});

t('every converted observation passes the contract gate (Ingest-ready)', () => {
  for (const o of observations) {
    const { valid, errors } = validateObservation(o, AX[o.axis_id] || null);
    assert.equal(valid, true, `${o.axis_id}: ${errors.join('; ')}`);
  }
});

t('char_density observation is stamped with protocol id + version (commensurability over time)', () => {
  const cd = observations.find(o => o.axis_id === 'char_density');
  assert.equal(cd.provenance.measurement_protocol_id, 'CHAR-DENSITY-PROT-001');
  assert.equal(cd.provenance.measurement_protocol_version, 'v1.0');
  // axis declares the same current protocol identity
  assert.equal(AX.char_density.measurement_protocol_id, 'CHAR-DENSITY-PROT-001');
});

t('time_to_failure uses the reconciled in-house method (not EN 13381-8)', () => {
  const ttf = observations.find(o => o.axis_id === 'time_to_failure');
  assert.equal(ttf.method, 'heat_to_500C_count_minutes');
  assert.equal(AX.time_to_failure.method, 'heat_to_500C_count_minutes'); // axis aligned
});

console.log(`\n${passed} passed`);
