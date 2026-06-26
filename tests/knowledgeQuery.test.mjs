/**
 * Tests for the knowledge query layer. Run: node tests/knowledgeQuery.test.mjs
 * Uses the real configs so it also guards that the playbook stays queryable by class/scope.
 */
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const Q = await import(pathToFileURL(path.resolve(root, 'lib/knowledgeQuery.js')).href);
const playbook = cfg('engineering_playbook_v1.json');
const queue = cfg('expert_interview_queue_v1.json');

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('byClass covers all four knowledge classes', () => {
  const c = Q.byClass(playbook);
  for (const k of ['engineering_principle', 'production_strategy', 'operational_rule', 'decision_heuristic']) assert.ok(c[k] > 0, k);
});

t('rules filter by knowledge_class', () => {
  const principles = Q.rules(playbook, { knowledge_class: 'engineering_principle' });
  assert.ok(principles.length >= 1);
  assert.ok(principles.every(r => r.knowledge_class === 'engineering_principle'));
});

t('rules filter by family scope (dry powder)', () => {
  const dp = Q.rules(playbook, { family: 'dry powder' });
  assert.ok(dp.length >= 1, 'some rules verified for dry powder');
  assert.ok(dp.every(r => (r.confidence_scope.verified_for || []).some(s => /dry powder/i.test(s))));
});

t('questions exposes the active question + one-at-a-time mode', () => {
  const q = Q.questions(queue);
  assert.equal(q.active, 'Q-001');
  assert.equal(q.mode, 'one_question_at_a_time');
  assert.ok(q.open.length >= 1);
});

t('summary lists 7 libraries and counts rules', () => {
  const s = Q.summary({ playbook, streams: cfg('evidence_streams_v1.json'), queue });
  assert.equal(s.libraries.length, 7);
  assert.equal(s.engineering_rules, (playbook.rules || []).length);
});

console.log(`\n${passed} passed`);
