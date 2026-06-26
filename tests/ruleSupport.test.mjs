/**
 * Tests for the Knowledge Evolution layer. Run: node tests/ruleSupport.test.mjs
 * Synthetic evidence sets (not committed) prove the status transitions; the real config is
 * empty (all rules 'asserted') by design until evidence flows.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const RS = await import(pathToFileURL(path.resolve(here, '../lib/ruleSupport.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('0 evidence → asserted (expert only)', () => {
  assert.equal(RS.computeSupport('ENG-001', []).status, 'asserted');
});

t('1 supporting → single_support (fragile)', () => {
  const r = RS.computeSupport('ENG-001', [{ rule_id: 'ENG-001', evs_id: 'EVS-1', stance: 'support' }]);
  assert.equal(r.status, 'single_support');
  assert.equal(r.support_count, 1);
});

t('2 supporting → supported (medium)', () => {
  const r = RS.computeSupport('ENG-001', [
    { rule_id: 'ENG-001', evs_id: 'EVS-1', stance: 'support' },
    { rule_id: 'ENG-001', evs_id: 'EVS-2', stance: 'support' },
  ]);
  assert.equal(r.status, 'supported');
  assert.equal(r.confidence, 'medium');
});

t('3 supporting, 0 contradicting → promotion_ready', () => {
  const links = [1, 2, 3].map(i => ({ rule_id: 'ENG-001', evs_id: 'EVS-' + i, stance: 'support' }));
  assert.equal(RS.computeSupport('ENG-001', links).status, 'promotion_ready');
});

t('a contradiction weakens the rule (contested)', () => {
  const r = RS.computeSupport('ENG-001', [
    { rule_id: 'ENG-001', evs_id: 'EVS-1', stance: 'support' },
    { rule_id: 'ENG-001', evs_id: 'EVS-9', stance: 'contradict' },
  ]);
  assert.equal(r.status, 'contested');
});

t('contradictions >= support → refuted', () => {
  const r = RS.computeSupport('ENG-001', [{ rule_id: 'ENG-001', evs_id: 'EVS-9', stance: 'contradict' }]);
  assert.equal(r.status, 'refuted');
});

t('evolution queries bucket correctly', () => {
  const rules = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
  const links = [
    { rule_id: 'A', evs_id: 'e1', stance: 'support' }, { rule_id: 'A', evs_id: 'e2', stance: 'support' }, { rule_id: 'A', evs_id: 'e3', stance: 'support' },
    { rule_id: 'B', evs_id: 'e4', stance: 'contradict' },
  ];
  const state = RS.evolve(rules, links);
  assert.deepEqual(RS.promotionReady(state).map(r => r.rule_id), ['A']);
  assert.deepEqual(RS.weakened(state).map(r => r.rule_id), ['B']);
  assert.deepEqual(RS.assertedOnly(state).map(r => r.rule_id), ['C']);
});

t('changedSince filters by last_updated', () => {
  const links = [{ rule_id: 'A', evs_id: 'e1', stance: 'support', date: '2026-06-26' }];
  const state = RS.evolve([{ id: 'A' }], links);
  assert.equal(RS.changedSince(state, '2026-06-20').length, 1);
  assert.equal(RS.changedSince(state, '2026-07-01').length, 0);
});

console.log(`\n${passed} passed`);
