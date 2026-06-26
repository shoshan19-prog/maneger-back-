/**
 * Tests for the Prediction loop-closer. Run: node tests/prediction.test.mjs
 * Proves the loop-back: a resolved prediction becomes a RuleSupport link.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const P = await import(pathToFileURL(path.resolve(here, '../lib/prediction.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const base = { id: 'PRED-1', target: 'ENG-009', prediction: 'if X then Y', measurable_outcome: 'axis Z' };

t('validatePrediction requires target/prediction/measurable_outcome', () => {
  assert.equal(P.validatePrediction({ ...base, status: 'open' }).valid, true);
  assert.equal(P.validatePrediction({ target: 'ENG-009' }).valid, false);
});

t('open includes proposed + open; resolved includes confirmed + refuted', () => {
  const preds = [{ ...base, status: 'open' }, { ...base, id: 'p2', status: 'confirmed' }, { ...base, id: 'p3', status: 'refuted' }];
  assert.equal(P.open(preds).length, 1);
  assert.equal(P.resolved(preds).length, 2);
});

t('a confirmed prediction → support link (loop closes into RuleSupport)', () => {
  const l = P.toRuleLink({ ...base, status: 'confirmed', experiment: 'E-012' });
  assert.deepEqual(l, { rule_id: 'ENG-009', evs_id: 'E-012', stance: 'support', date: null });
});

t('a refuted prediction → contradict link', () => {
  assert.equal(P.toRuleLink({ ...base, status: 'refuted', experiment: 'E-012' }).stance, 'contradict');
});

t('unresolved prediction yields no link', () => {
  assert.equal(P.toRuleLink({ ...base, status: 'open' }), null);
});

t('ruleLinks collects only resolved predictions', () => {
  const preds = [{ ...base, status: 'open' }, { ...base, id: 'p2', status: 'confirmed', experiment: 'E-1' }];
  assert.equal(P.ruleLinks(preds).length, 1);
});

console.log(`\n${passed} passed`);
