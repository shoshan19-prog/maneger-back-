/**
 * Tests for the boundary derivation engine. Run: node tests/boundaryDerive.test.mjs
 * Lightweight (node:assert), matching the matriya-system test style.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { deriveBoundary } = await import(pathToFileURL(path.resolve(here, '../lib/boundaryDerive.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

// Scenario: denser char protects. Low density FAILS, high density WORKS.
// density (input) -> TTF (response). Known true boundary ~ between 100 and 120.
const denseScan = [
  { input: 90,  response: 50, outcome: 'fails' },
  { input: 100, response: 55, outcome: 'fails' },
  { input: 120, response: 80, outcome: 'works' },
  { input: 140, response: 95, outcome: 'works' },
];

t('recovers a bracketed boundary with correct direction', () => {
  const r = deriveBoundary(denseScan, { mme: 1.44 });
  assert.equal(r.bracketed, true);
  assert.equal(r.direction, 'fails_below');              // failures sit below works
  assert.deepEqual(r.interval, [100, 120]);
  assert.equal(r.boundary, 110);
});

t('computes sigma = MME / |slope| in input units (commensurable)', () => {
  const r = deriveBoundary(denseScan, { mme: 1.44 });
  // slope across crossing = (80-55)/(120-100) = 1.25 ; sigma = 1.44/1.25 = 1.152
  assert.ok(Math.abs(r.slope - 1.25) < 1e-9);
  assert.ok(Math.abs(r.sigma - (1.44 / 1.25)) < 1e-9);
  assert.deepEqual(r.confidence_interval, [110 - 2 * r.sigma, 110 + 2 * r.sigma]);
});

t('flags separability vs the noise floor', () => {
  assert.equal(deriveBoundary(denseScan, { mme: 1.44 }).separable, true);   // dResp=25 >> 1.44
  assert.equal(deriveBoundary(denseScan, { mme: 100 }).separable, false);   // dResp=25 < 100
});

t('fails-above direction is detected', () => {
  // expansion-style: high value FAILS, low value WORKS
  const r = deriveBoundary([
    { input: 20, response: 70, outcome: 'works' },
    { input: 25, response: 60, outcome: 'works' },
    { input: 30, response: 40, outcome: 'fails' },
  ], { mme: 1.44 });
  assert.equal(r.direction, 'fails_above');
  assert.deepEqual(r.interval, [25, 30]);
});

t('refuses to derive without both Works and Fails (bracketing rule)', () => {
  const r = deriveBoundary([
    { input: 90, response: 50, outcome: 'works' },
    { input: 120, response: 80, outcome: 'works' },
  ], { mme: 1.44 });
  assert.equal(r.bracketed, false);
  assert.match(r.reason, /both a Works and a Fails/);
});

t('detects non-monotonic response (possible confound)', () => {
  const r = deriveBoundary([
    { input: 90,  response: 50, outcome: 'fails' },
    { input: 120, response: 90, outcome: 'works' },
    { input: 140, response: 70, outcome: 'works' },  // dips back down
  ], { mme: 1.44 });
  assert.equal(r.monotonic, false);
  assert.ok(r.notes.some(n => /not monotonic/.test(n)));
});

t('no MME -> sigma null, separability null, still brackets', () => {
  const r = deriveBoundary(denseScan, {});
  assert.equal(r.bracketed, true);
  assert.equal(r.sigma, null);
  assert.equal(r.separable, null);
});

console.log(`\n${passed} passed`);
