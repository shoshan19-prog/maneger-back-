/**
 * Tests for the Learning KPI + Knowledge Delta. Run: node tests/learningKpi.test.mjs
 * The core check: Knowledge Delta distinguishes representation (no change) from generation (change).
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const K = await import(pathToFileURL(path.resolve(here, '../lib/learningKpi.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('empty system: prediction_accuracy n/a, no impact', () => {
  const k = K.computeLearningKpi({});
  assert.equal(k.prediction_accuracy, null);
  assert.equal(k.engineering_impact, 0);
});

t('prediction accuracy = confirmed / resolved', () => {
  const k = K.computeLearningKpi({ predictions: [{ status: 'confirmed' }, { status: 'confirmed' }, { status: 'refuted' }, { status: 'open' }] });
  assert.equal(k.prediction_accuracy, 67);     // 2/3
  assert.equal(k.active_predictions, 1);
});

t('engineering impact counts decisions driven by knowledge', () => {
  const k = K.computeLearningKpi({ decisions: [{ driven_by_rules: ['ENG-001'] }, { changed_by_new_knowledge: true }, {}] });
  assert.equal(k.engineering_impact, 2);
});

t('Knowledge Delta: no baseline → baseline flag', () => {
  assert.equal(K.computeKnowledgeDelta(null, {}).baseline, true);
});

t('Knowledge Delta: identical snapshots → NO change (representation, not generation)', () => {
  const s = K.snapshot({ ruleState: [{ rule_id: 'A', status: 'asserted' }] });
  const d = K.computeKnowledgeDelta(s, s);
  assert.equal(d.changed, false);
});

t('Knowledge Delta: a rule strengthening → CHANGED', () => {
  const prev = K.snapshot({ ruleState: [{ rule_id: 'A', status: 'asserted' }] });
  const curr = K.snapshot({ ruleState: [{ rule_id: 'A', status: 'supported' }] });
  const d = K.computeKnowledgeDelta(prev, curr);
  assert.equal(d.changed, true);
  assert.equal(d.strengthened, 1);
});

t('Knowledge Delta: a rule refuted is counted as refuted (not just weakened)', () => {
  const prev = K.snapshot({ ruleState: [{ rule_id: 'A', status: 'supported' }] });
  const curr = K.snapshot({ ruleState: [{ rule_id: 'A', status: 'refuted' }] });
  assert.equal(K.computeKnowledgeDelta(prev, curr).refuted, 1);
});

console.log(`\n${passed} passed`);
