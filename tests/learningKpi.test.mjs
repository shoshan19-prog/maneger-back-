/**
 * Tests for the Learning KPI. Run: node tests/learningKpi.test.mjs
 * Verifies the metric reflects loop activity — 0 when empty, moving when the loop turns.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { computeLearningKpi } = await import(pathToFileURL(path.resolve(here, '../lib/learningKpi.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('empty system → loop_activity 0 (honest: nothing learned yet)', () => {
  const k = computeLearningKpi({});
  assert.equal(k.loop_activity, 0);
  assert.equal(k.resolved_predictions, 0);
});

t('counts open vs resolved questions', () => {
  const k = computeLearningKpi({ questions: [{ id: 'Q1' }, { id: 'Q2', status: 'resolved' }] });
  assert.equal(k.open_questions, 1);
  assert.equal(k.resolved_questions, 1);
});

t('predictions: active vs resolved', () => {
  const k = computeLearningKpi({ predictions: [{ status: 'open' }, { status: 'confirmed' }, { status: 'refuted' }] });
  assert.equal(k.active_predictions, 1);
  assert.equal(k.resolved_predictions, 2);
});

t('rule states roll up (refuted / promotion-ready / asserted)', () => {
  const ruleState = [{ status: 'refuted' }, { status: 'promotion_ready' }, { status: 'asserted' }, { status: 'contested' }];
  const k = computeLearningKpi({ ruleState });
  assert.equal(k.refuted_rules, 1);
  assert.equal(k.weakened_rules, 2);            // contested + refuted
  assert.equal(k.promotion_ready_rules, 1);
  assert.equal(k.asserted_rules, 1);
});

t('loop_activity rises when the loop turns', () => {
  const k = computeLearningKpi({ predictions: [{ status: 'confirmed' }], mechanisms: [{ status: 'candidate' }], questions: [{ status: 'resolved' }] });
  assert.ok(k.loop_activity >= 3);
});

console.log(`\n${passed} passed`);
