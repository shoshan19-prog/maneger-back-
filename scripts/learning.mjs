#!/usr/bin/env node
/**
 * Learning KPI CLI (Fresco) — knowledge GENERATION, not activity. Headline = Knowledge Delta
 * (did the graph change since the last snapshot?). Four KPIs: Questions Answered · Knowledge
 * Delta · Prediction Accuracy · Engineering Impact.
 * Usage:
 *   npm run learning                          # current KPIs + Knowledge Delta vs last snapshot
 *   npm run learning -- --snapshot --date 2026-06-26   # append a snapshot to the history
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfgPath = (n) => path.join(root, 'config', n);
const cfg = (n) => JSON.parse(fs.readFileSync(cfgPath(n), 'utf8'));
const imp = (p) => import(pathToFileURL(path.resolve(root, 'lib/' + p)).href);
const K = await imp('learningKpi.js');
const RS = await imp('ruleSupport.js');

const playbook = cfg('engineering_playbook_v1.json');
const mech = cfg('mechanism_registry_v1.json');
const questions = cfg('expert_interview_queue_v1.json').questions || [];
const predictions = cfg('prediction_registry_v1.json').predictions || [];
const decisions = cfg('decision_library_v1.json').decisions || [];
const ruleState = RS.evolve((playbook.rules || []).map(r => ({ id: r.id, knowledge_class: r.knowledge_class })), cfg('rule_support_v1.json').links || []);
const inputs = { questions, predictions, decisions, mechanisms: mech.mechanisms || [], watchedPatterns: mech.watched_patterns || [], ruleState };

const kpi = K.computeLearningKpi(inputs);
const date = process.argv.includes('--date') ? process.argv[process.argv.indexOf('--date') + 1] : null;
const curr = K.snapshot(inputs, date);

if (process.argv.includes('--snapshot')) {
  const hist = cfg('learning_history_v1.json');
  hist.snapshots.push(curr);
  fs.writeFileSync(cfgPath('learning_history_v1.json'), JSON.stringify(hist, null, 2) + '\n');
  console.log(`snapshot appended (${hist.snapshots.length} total).`);
  process.exit(0);
}

const hist = cfg('learning_history_v1.json').snapshots || [];
const delta = K.computeKnowledgeDelta(hist[hist.length - 1], curr);

console.log('\nMATRIYA — Learning KPI (knowledge generation, not activity)\n');
console.log('1. QUESTIONS ANSWERED :', `${kpi.questions_answered} answered · ${kpi.open_questions} open`);
console.log('2. KNOWLEDGE Δ        :', delta.baseline ? 'no baseline yet (take a snapshot to start the series)'
  : (delta.changed ? `CHANGED — +${delta.new_rules} new · ${delta.strengthened}↑ · ${delta.weakened}↓ · ${delta.refuted} refuted · ${delta.questions_answered} Q · ${delta.predictions_resolved} pred · ${delta.mechanisms_confirmed} mech` : 'NO CHANGE — graph(t+1) == graph(t) → no knowledge generated'));
console.log('3. PREDICTION ACCURACY:', kpi.prediction_accuracy == null ? 'n/a (0 predictions resolved)' : `${kpi.prediction_accuracy}% (${kpi.resolved_predictions} resolved)`);
console.log('4. ENGINEERING IMPACT :', `${kpi.engineering_impact} decision(s) changed by new knowledge`);
console.log('\nState: rules', JSON.stringify(kpi.rule_status_distribution), '· active predictions', kpi.active_predictions, '· watched patterns', kpi.watched_patterns);
console.log('\nRepresentation ≠ Generation: the graph is consistent; until Knowledge Δ shows CHANGE on real data, no new knowledge has been created.\n');
