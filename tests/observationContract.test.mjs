/**
 * Tests for the Observation Contract — the single ingest gate. Run: node tests/observationContract.test.mjs
 * Uses the real canonical axes (lib/boundaryAxes.js), so these lock the live behavior of
 * commensurability, provenance, and the profile-axis RULE (viscosity needs spindle+rpm+temp).
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { validateObservation } = await import(pathToFileURL(path.resolve(here, '../lib/observationContract.js')).href);
const { axesById } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryAxes.js')).href);
const AX = axesById();

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const prov = { source_type: 'lab_measurement', source_reference: 'panel-001', observed_by: 'Rachel', observed_at: '2026-06-25' };
// a clean pH observation against the new canonical axis
const phObs = () => ({ project_id: 'QC-PAINT', axis_id: 'ph', value: 8.4, unit: 'pH', method: 'pH_meter_direct', uncertainty: 0.1, provenance: { ...prov } });

t('pH is now a canonical axis (Fresco GO 2026-06-25)', () => {
  assert.ok(AX.ph, 'ph present in Axis Authority');
  assert.equal(AX.ph.canonical_unit, 'pH');
});

t('a clean pH observation passes the gate', () => {
  const { valid, errors } = validateObservation(phObs(), AX.ph);
  assert.equal(valid, true, errors.join('; '));
});

t('missing required field is rejected', () => {
  const o = phObs(); delete o.value;
  const { valid, errors } = validateObservation(o, AX.ph);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('value')));
});

t('incommensurable unit is rejected (commensurability)', () => {
  const o = phObs(); o.unit = 'pct';
  const { valid, errors } = validateObservation(o, AX.ph);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('commensurable')));
});

t('unknown axis is rejected', () => {
  const { valid, errors } = validateObservation(phObs(), null);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('Axis Authority')));
});

// --- profile-axis RULE: viscosity must carry spindle + rpm + temperature ---
const viscBase = () => ({ project_id: 'INT-TFX', axis_id: 'wet_viscosity', value: 4200, unit: 'cP', method: 'rotational_viscosity_profile', uncertainty: 50, provenance: { ...prov } });
const viscConds = { spindle: { value: 3, unit: 'index' }, rpm: { value: 12, unit: 'rpm' }, temperature: { value: 25, unit: 'C' } };

t('viscosity WITHOUT spindle/rpm/temperature is rejected (RULE)', () => {
  const { valid, errors } = validateObservation(viscBase(), AX.wet_viscosity);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('spindle')), 'requires spindle');
  assert.ok(errors.some(e => e.includes('rpm')) || errors.some(e => e.includes('profile axis')));
});

t('viscosity WITH spindle+rpm+temperature passes', () => {
  const o = viscBase(); o.conditions = { ...viscConds };
  const { valid, errors } = validateObservation(o, AX.wet_viscosity);
  assert.equal(valid, true, errors.join('; '));
});

t('viscosity missing only temperature is still rejected', () => {
  const o = viscBase(); o.conditions = { spindle: viscConds.spindle, rpm: viscConds.rpm };
  const { valid, errors } = validateObservation(o, AX.wet_viscosity);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('temperature')));
});

// --- char_density: the controlling fire axis (GO 2026-06-25) ---
const charBase = () => ({ project_id: 'INT-TFX', axis_id: 'char_density', value: 120, unit: 'kg/m3', method: 'char_mass_over_volume', uncertainty: 4, provenance: { ...prov } });
const charConds = {
  initial_film_thickness: { value: 800, unit: 'micron' }, exposed_area: { value: 100, unit: 'cm2' },
  burn_profile: { value: 500, unit: 'C' }, sample_age: { value: 7, unit: 'days' },
};

t('char_density is canonical, quantitative (kg/m3) and boundary-eligible (NOT a profile axis)', () => {
  assert.ok(AX.char_density, 'char_density present');
  assert.equal(AX.char_density.canonical_unit, 'kg/m3');
  assert.notEqual(AX.char_density.profile, true);   // must remain derivable as a boundary axis
});

t('char_density WITHOUT its measurement context is rejected', () => {
  const { valid, errors } = validateObservation(charBase(), AX.char_density);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('initial_film_thickness')));
});

t('char_density WITH full context (film thickness, area, burn profile, age) passes', () => {
  const o = charBase(); o.conditions = { ...charConds };
  const { valid, errors } = validateObservation(o, AX.char_density);
  assert.equal(valid, true, errors.join('; '));
});

t('char_density carries a fixed measurement_protocol (commensurability beyond unit/method)', () => {
  const proto = AX.char_density.measurement_protocol;
  assert.ok(Array.isArray(proto) && proto.length >= 5, 'protocol steps present');
  assert.ok(proto.some(s => /mass\s*\/\s*volume/i.test(s)), 'ends in density = mass/volume');
});

console.log(`\n${passed} passed`);
