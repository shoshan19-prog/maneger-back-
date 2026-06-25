/** Tests for the incompatibility boundary engine. Run: node tests/incompatibilityBoundary.test.mjs */
import assert from 'node:assert';
import path from 'path'; import { pathToFileURL } from 'url';
const here = path.dirname(new URL(import.meta.url).pathname);
const { deriveIncompatibility } = await import(pathToFileURL(path.resolve(here, '../lib/incompatibilityBoundary.js')).href);
let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };

// PR-TFX: K-silicate fails across types/dilutions; full component set present; no isolation.
const ALL = ['zinc_borate','zinc_phosphate','melamine','emulsion_2403','emulsion_58'];
const prtfx = [
  {agent:'potassium_silicate', components:ALL, outcome:'fail', variant:'KSIL34 20%'},
  {agent:'potassium_silicate', components:ALL, outcome:'fail', variant:'P35 20%'},
  {agent:'potassium_silicate', components:ALL, outcome:'fail', variant:'KASIL2135 20%'},
  {agent:'potassium_silicate', components:ALL, outcome:'fail', variant:'KSIL34 50%'},
];
t('PR-TFX: broadly incompatible, PARTIAL_VERIFIED, candidates = all components', () => {
  const r = deriveIncompatibility(prtfx);
  assert.equal(r.status, 'PARTIAL_VERIFIED');
  assert.equal(r.broadly_incompatible, true);
  assert.equal(r.culprits, null);
  assert.equal(r.candidates.length, 5);
  assert.match(r.next_experiment, /Isolate/);
});
t('isolation test names a confirmed culprit -> VERIFIED', () => {
  const r = deriveIncompatibility([...prtfx, {agent:'potassium_silicate', components:['zinc_borate'], outcome:'fail'}]);
  assert.equal(r.status, 'VERIFIED');
  assert.deepEqual(r.culprits, ['zinc_borate']);
});
t('a passing test exonerates its components from candidates', () => {
  const r = deriveIncompatibility([
    {agent:'potassium_silicate', components:['zinc_borate','melamine'], outcome:'fail'},
    {agent:'potassium_silicate', components:['melamine'], outcome:'pass'}, // melamine alone is fine
  ]);
  // not broadly incompatible (a pass exists); melamine exonerated
  assert.ok(r.exonerated.includes('melamine'));
});
t('all pass -> not an incompatibility', () => {
  const r = deriveIncompatibility([
    {agent:'x', components:['a'], outcome:'pass'},
    {agent:'x', components:['b'], outcome:'pass'},
  ]);
  assert.notEqual(r.status, 'VERIFIED');
  assert.equal(r.broadly_incompatible, false);
});
console.log(`\n${passed} passed`);
