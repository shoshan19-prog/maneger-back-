/** Tests for measurement coverage join. Run: node tests/measurementCoverage.test.mjs */
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
const here = path.dirname(new URL(import.meta.url).pathname);
const { measurementCoverage, coverageSummary } = await import(pathToFileURL(path.resolve(here, '../lib/measurementCoverage.js')).href);
const prop = JSON.parse(fs.readFileSync(path.resolve(here, '../config/property_registry_canonical_v1.json'), 'utf8'));
const equip = JSON.parse(fs.readFileSync(path.resolve(here, '../config/lab_equipment_seed_v1.json'), 'utf8'));

let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };
const cov = measurementCoverage(prop.properties, equip.equipment);
const get = id => cov.find(c => c.axis === id);

t('expansion_ratio is measurable on the muffle furnace', () => {
  const c = get('expansion_ratio');
  assert.equal(c.measurable, true);
  assert.ok(c.instruments.some(i => /HOBERSAL Muffle/.test(i)));
});
t('pull_off_adhesion maps to the adhesion testers', () => {
  const c = get('pull_off_adhesion');
  assert.equal(c.measurable, true);
  assert.ok(c.instruments.some(i => /LANGRY/.test(i)));
});
t('time_to_failure joins via FIRE_DRY base code (parens stripped)', () => {
  assert.equal(get('time_to_failure').measurable, true);  // FIRE_DRY(min) -> FIRE_DRY
});
t('capillary_absorption is a real coverage gap (no rig)', () => {
  assert.equal(get('capillary_absorption').measurable, false);
});
t('summary counts measurable vs gaps', () => {
  const s = coverageSummary(prop.properties, equip.equipment);
  assert.equal(s.total, prop.properties.length);
  assert.ok(s.measurable >= 15);
  assert.ok(s.gaps.includes('capillary_absorption'));
});
console.log(`\n${passed} passed`);
