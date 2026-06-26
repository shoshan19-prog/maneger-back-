#!/usr/bin/env node
/**
 * Knowledge model CLI — query the captured knowledge (turns inert config into answers).
 * Usage:
 *   npm run knowledge                       # summary (streams, libraries, rules by class)
 *   node scripts/knowledge.mjs rules [--class engineering_principle] [--family "dry powder"]
 *   node scripts/knowledge.mjs questions    # open operational-knowledge questions + active
 *   node scripts/knowledge.mjs scope <family>   # rules verified for a product family
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const Q = await import(pathToFileURL(path.resolve(root, 'lib/knowledgeQuery.js')).href);

const playbook = cfg('engineering_playbook_v1.json');
const streams = cfg('evidence_streams_v1.json');
const queue = cfg('expert_interview_queue_v1.json');
const arg = (k) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined;
const mode = process.argv[2];

if (mode === 'rules' || mode === 'scope') {
  const family = mode === 'scope' ? process.argv[3] : arg('--family');
  const list = Q.rules(playbook, { knowledge_class: arg('--class'), family });
  console.log(`\n${list.length} engineering rule(s)${arg('--class') ? ' · class=' + arg('--class') : ''}${family ? ' · verified for "' + family + '"' : ''}:\n`);
  for (const r of list) console.log(`  ${r.id} [${r.knowledge_class}]  ${r.rule}\n        verified_for: ${(r.confidence_scope?.verified_for || []).join(', ')}`);
  console.log('');
} else if (mode === 'questions') {
  const q = Q.questions(queue);
  console.log(`\nOperational-knowledge interview (${q.mode}) · active: ${q.active}\n`);
  for (const x of q.open) console.log(`  ${x.id === q.active ? '▶' : ' '} ${x.id} [${x.area}]  ${x.question}`);
  console.log('');
} else {
  const s = Q.summary({ playbook, streams, queue });
  console.log('\nMATRIYA Knowledge Model\n');
  console.log('Libraries (7):', s.libraries.join(' · '));
  console.log('\nStreams:'); s.streams.forEach(x => console.log(`  ${x.id.padEnd(20)} validator=${x.validator}  status=${x.status}`));
  console.log(`\nEngineering Playbook: ${s.engineering_rules} rules`);
  for (const [k, v] of Object.entries(s.by_class)) console.log(`  ${String(v).padStart(2)}  ${k}`);
  console.log(`\nScope verified: ${s.scope_verified.join(', ')}`);
  console.log(`Open questions: ${s.open_questions} · active: ${s.active_question}`);
  console.log('\n(node scripts/knowledge.mjs rules|questions|scope <family>)\n');
}
