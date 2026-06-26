/**
 * Tests for the Discriminability Assessment (the fourth primitive). Run:
 *   node tests/discriminability.test.mjs
 * Core checks: (1) a rich Evidence Set can still be a Discriminating Evidence Gap; (2) the system
 * REFUSES to assess when a hypothesis has no human-authored discriminator (no inference); (3) the
 * gap statement and the kernel fail-safe signal are produced from declarations only.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'node:fs';

const here = path.dirname(new URL(import.meta.url).pathname);
const D = await import(pathToFileURL(path.resolve(here, '../lib/discriminability.js')).href);
const depths = JSON.parse(readFileSync(path.resolve(here, '../config/discovery_depths_v1.json'), 'utf8'));
const ladder = depths.depth_ladder;

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('needs ≥2 hypotheses → not_applicable', () => {
  assert.equal(D.assessDiscriminability([{ id: 'H1', distinguished_by: ['x'] }], []).status, 'not_applicable');
});

t('REFUSES when a hypothesis has no human-authored discriminator (no inference)', () => {
  const r = D.assessDiscriminability([{ id: 'H1', distinguished_by: ['failure_mode'] }, { id: 'H2' }], []);
  assert.equal(r.status, 'declaration_required');
  assert.deepEqual(r.undeclared, ['H2']);
});

t('rich Evidence Set, zero discriminability → Discriminating Evidence Gap', () => {
  // viscosity/pH/density are present, but the declared discriminator is recoverability_after_remix.
  const r = D.assessDiscriminability(
    [{ id: 'H1', distinguished_by: ['recoverability_after_remix'] },
     { id: 'H2', distinguished_by: ['recoverability_after_remix'] }],
    ['wet_viscosity', 'ph', 'density'], { ladder });
  assert.equal(r.status, 'discriminating_evidence_gap');
  assert.equal(r.discriminable, false);
  assert.match(r.message, /Cannot discriminate between H1 and H2/);
  assert.equal(r.suggested_depths[0].suggested_depth, 'recoverability_after_remix');
});

t('declared discriminator present → discriminable', () => {
  const r = D.assessDiscriminability(
    [{ id: 'H1', distinguished_by: ['recoverability_after_remix'] },
     { id: 'H2', distinguished_by: ['recoverability_after_remix'] }],
    ['recoverability_after_remix'], { ladder });
  assert.equal(r.status, 'discriminable');
  assert.equal(r.discriminable, true);
});

t('missing discriminators are ordered shallow→deep (cost ordering only)', () => {
  const r = D.assessDiscriminability(
    [{ id: 'H1', distinguished_by: ['SEM'] }, { id: 'H2', distinguished_by: ['failure_mode'] }],
    [], { ladder });
  // union {SEM rank4, failure_mode rank2} → shallowest missing first = failure_mode
  assert.equal(r.gaps[0].missing[0], 'failure_mode');
  assert.equal(r.suggested_depths[0].suggested_depth, 'failure_mode');
});

t('toFailSafeSignal: a real gap sets variables_distinguishable=false', () => {
  const r = D.assessDiscriminability(
    [{ id: 'H1', distinguished_by: ['SEM'] }, { id: 'H2', distinguished_by: ['SEM'] }], []);
  assert.deepEqual(D.toFailSafeSignal(r), { variables_distinguishable: false });
});

t('toFailSafeSignal: declaration_required asserts NOTHING (empty signal)', () => {
  const r = D.assessDiscriminability([{ id: 'H1', distinguished_by: ['x'] }, { id: 'H2' }], []);
  assert.deepEqual(D.toFailSafeSignal(r), {});
});

t('worked example in config resolves to a gap with the declared discriminator', () => {
  const e = JSON.parse(readFileSync(path.resolve(here, '../config/discriminability_v1.json'), 'utf8')).worked_example;
  const r = D.assessDiscriminability(e.hypotheses, e.evidence_set_present, { ladder });
  assert.equal(r.status, 'discriminating_evidence_gap');
  assert.equal(r.suggested_depths[0].suggested_depth, e.suggested_depth);
});

console.log(`\n${passed} passed`);
