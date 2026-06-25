/** Tests for contradiction detection. Run: node tests/contradictionDetect.test.mjs */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { findContradictions } = await import(pathToFileURL(path.resolve(here, '../lib/contradictionDetect.js')).href);

let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };

const ob = (axis, value, outcome, thk, ref) => ({
  axis_id: axis, value, outcome_class: outcome,
  conditions: { FILM_THICKNESS: { value: thk, unit: 'micron' } },
  provenance: { source_reference: ref },
});

t('flags outcome conflict: works and fails at the same context', () => {
  const c = findContradictions([
    ob('TIME_TO_FAILURE', 80, 'works', 1000, 'A'),
    ob('TIME_TO_FAILURE', 40, 'fails', 1000, 'B'),
  ]);
  assert.equal(c.length, 1);
  assert.equal(c[0].type, 'outcome_conflict');
  assert.equal(c[0].axis, 'TIME_TO_FAILURE');
});

t('no conflict when contexts differ (different thickness bucket)', () => {
  const c = findContradictions([
    ob('TIME_TO_FAILURE', 80, 'works', 1000, 'A'),
    ob('TIME_TO_FAILURE', 40, 'fails', 2000, 'B'),
  ]);
  assert.equal(c.length, 0);
});

t('flags value conflict beyond MME at the same context', () => {
  const c = findContradictions([
    ob('CHAR_DENSITY', 100, null, 1000, 'A'),
    ob('CHAR_DENSITY', 130, null, 1000, 'B'),
  ], { axisMme: { CHAR_DENSITY: 10 } });
  assert.equal(c.length, 1);
  assert.equal(c[0].type, 'value_conflict');
  assert.equal(c[0].spread, 30);
});

t('no value conflict when spread is within MME', () => {
  const c = findContradictions([
    ob('CHAR_DENSITY', 100, null, 1000, 'A'),
    ob('CHAR_DENSITY', 105, null, 1000, 'B'),
  ], { axisMme: { CHAR_DENSITY: 10 } });
  assert.equal(c.length, 0);
});

t('value conflict not flagged without an MME (cannot judge noise)', () => {
  const c = findContradictions([
    ob('CHAR_DENSITY', 100, null, 1000, 'A'),
    ob('CHAR_DENSITY', 130, null, 1000, 'B'),
  ]);
  assert.equal(c.length, 0);
});

console.log(`\n${passed} passed`);
