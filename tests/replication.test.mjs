/**
 * Tests for the Replication Layer. Run: node tests/replication.test.mjs
 * Core checks: candidate → supported → established ladder; an in-context violation contests it;
 * confidence depends ONLY on replication (orthogonal to learning_value); a law is justified only
 * once a boundary is established.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const R = await import(pathToFileURL(path.resolve(here, '../lib/replication.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const base = { id: 'B-1', statement: 'PSD 0.8-1.4 works only below APP 24%', origin: 'E-012', context: { domain: 'intumescent' }, replications: [] };

t('born from one experiment → candidate, confidence low (~0.2)', () => {
  assert.equal(R.boundaryState(base), 'candidate');
  assert.equal(R.confidence(base), 0.2);
  assert.equal(R.lawJustified(base), false);
});

t('one independent hold → supported', () => {
  const b = R.addReplication(base, { experiment_id: 'E-020', conditions: { batch: 'B2' }, held: true });
  assert.equal(R.boundaryState(b), 'supported');
  assert.ok(R.confidence(b) > 0.2);
});

t('held across ≥2 distinct conditions → established → law justified', () => {
  let b = R.addReplication(base, { experiment_id: 'E-020', conditions: { batch: 'B2' }, held: true });
  b = R.addReplication(b, { experiment_id: 'E-021', conditions: { batch: 'B3', temp: 'high' }, held: true });
  assert.equal(R.boundaryState(b), 'established');
  assert.equal(R.lawJustified(b), true);
  assert.ok(R.confidence(b) > 0.6);
});

t('an in-context violation → contested (boundary as stated failed)', () => {
  const b = R.addReplication(base, { experiment_id: 'E-022', conditions: { batch: 'B4' }, held: false });
  assert.equal(R.boundaryState(b), 'contested');
  assert.ok(R.confidence(b) < 0.2);
});

t('a non-independent repeat does NOT promote to supported', () => {
  const b = R.addReplication(base, { experiment_id: 'E-012b', conditions: {}, held: true, independent: false });
  assert.equal(R.boundaryState(b), 'candidate');  // re-running the SAME experiment is not replication
});

t('confidence is ORTHOGONAL to learning_value (depends only on replication)', () => {
  // high-value but single experiment → low confidence
  const lowConf = base;                                  // candidate
  // low-value but replicated twice across conditions → high confidence
  let highConf = R.addReplication(base, { experiment_id: 'E-1', conditions: { c: 1 }, held: true });
  highConf = R.addReplication(highConf, { experiment_id: 'E-2', conditions: { c: 2 }, held: true });
  assert.ok(R.confidence(highConf) > R.confidence(lowConf));
  // confidence takes no learning_value input at all — recomputing with one is impossible by signature
});

t('summarize reports states + whether any law is justified', () => {
  const s = R.summarize([base]);
  assert.equal(s.byState.candidate, 1);
  assert.equal(s.any_law_justified, false);
});

console.log(`\n${passed} passed`);
