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
// --- projectCoverage (work gap) ---
import { projectCoverage } from '../lib/measurementCoverage.js';
const reg = JSON.parse(fs.readFileSync(path.resolve(here, '../config/project_test_registry_v1.json'), 'utf8'));
const intf = reg.projects.find(p => p.id === 'INT-TFX');
t('INT-TFX: expansion_ratio is now done (Rachel 2026-06-25 — measured as a composite)', () => {
  const rows = projectCoverage(prop.properties, equip.equipment, intf);
  const er = rows.find(r => r.axis === 'expansion_ratio');
  assert.ok(er, 'expansion_ratio present');
  assert.equal(er.project_status, 'done');
  assert.equal(er.gap, false);
});
t('INT-TFX: char_quality (char DENSITY) is the real work gap — measured only visually today', () => {
  const rows = projectCoverage(prop.properties, equip.equipment, intf);
  const cq = rows.find(r => r.axis === 'char_quality');
  assert.ok(cq, 'char_quality present');
  assert.equal(cq.measurable, true);       // muffle furnace measures CHAR_QUAL
  assert.equal(cq.gap, true);              // listed in `gap`: quantitative density not done
});
t('INT-TFX: time_to_failure is NOT a gap (already done)', () => {
  const rows = projectCoverage(prop.properties, equip.equipment, intf);
  const ttf = rows.find(r => r.axis === 'time_to_failure');
  assert.equal(ttf.project_status, 'done');
  assert.equal(ttf.gap, false);
});
console.log(`\n${passed} passed`);
