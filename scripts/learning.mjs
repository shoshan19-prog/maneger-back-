#!/usr/bin/env node
/**
 * Learning KPI CLI (Fresco) — measures knowledge creation, not software. Computed live from
 * the registries; most values are 0 until the loop runs on real data. Run: npm run learning
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const imp = (p) => import(pathToFileURL(path.resolve(root, 'lib/' + p)).href);
const { computeLearningKpi } = await imp('learningKpi.js');
const RS = await imp('ruleSupport.js');

const playbook = cfg('engineering_playbook_v1.json');
const support = cfg('rule_support_v1.json');
const mech = cfg('mechanism_registry_v1.json');
const ruleState = RS.evolve((playbook.rules || []).map(r => ({ id: r.id, knowledge_class: r.knowledge_class })), support.links || []);

const kpi = computeLearningKpi({
  questions: cfg('expert_interview_queue_v1.json').questions || [],
  predictions: cfg('prediction_registry_v1.json').predictions || [],
  mechanisms: mech.mechanisms || [],
  watchedPatterns: mech.watched_patterns || [],
  ruleState,
});

const row = (label, val, note) => console.log(`  ${String(val).padStart(3)}  ${label}${note ? '   — ' + note : ''}`);
console.log('\nMATRIYA — Learning KPI (knowledge creation, not software)\n');
row('open questions', kpi.open_questions, 'awaiting answers (David)');
row('resolved questions', kpi.resolved_questions);
row('active predictions', kpi.active_predictions, 'awaiting an experiment');
row('resolved predictions', kpi.resolved_predictions);
row('watched patterns', kpi.watched_patterns, 'not yet candidates');
row('candidate mechanisms', kpi.candidate_mechanisms);
row('confirmed mechanisms', kpi.confirmed_mechanisms);
row('rules: asserted (expert-only)', kpi.asserted_rules);
row('rules: promotion-ready', kpi.promotion_ready_rules);
row('rules: weakened/refuted', kpi.weakened_rules);
console.log(`\n  loop_activity = ${kpi.loop_activity}  (knowledge-moving signals; 0 = loop has not run on real data yet)`);
console.log('\nThese measure whether the loop is turning. Today ≈ 0 by design — feed real evidence to move them.\n');
