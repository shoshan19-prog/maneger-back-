#!/usr/bin/env node
/**
 * Knowledge Evolution CLI — rules as living entities (Fresco). Answers: what is supported,
 * weakened/contradicted, fragile (single evidence set), and ready for promotion to a verified
 * mechanism. Usage:
 *   npm run rules:evolution                         # full state + evolution buckets
 *   node scripts/rule_support.mjs --since 2026-06-20 # what changed since a date
 *   node scripts/rule_support.mjs link ENG-002 EVS-014 support --date 2026-06-26
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfgPath = path.join(root, 'config', 'rule_support_v1.json');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const RS = await import(pathToFileURL(path.resolve(root, 'lib/ruleSupport.js')).href);

const support = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const rules = (cfg('engineering_playbook_v1.json').rules || []).map(r => ({ id: r.id, knowledge_class: r.knowledge_class, rule: r.rule }));
const ruleText = Object.fromEntries(rules.map(r => [r.id, r.rule]));

if (process.argv[2] === 'link') {
  const [, , , rule_id, evs_id, stance] = process.argv;
  const date = process.argv.includes('--date') ? process.argv[process.argv.indexOf('--date') + 1] : null;
  if (!rule_id || !evs_id || !['support', 'contradict'].includes(stance)) { console.error('Usage: link <rule_id> <evs_id> support|contradict [--date D]'); process.exit(2); }
  support.links.push({ rule_id, evs_id, stance, date });
  fs.writeFileSync(cfgPath, JSON.stringify(support, null, 2) + '\n');
  console.log(`linked ${evs_id} ${stance}s ${rule_id} (${date || 'no date'})`);
  process.exit(0);
}

const state = RS.evolve(rules, support.links);
const since = process.argv.includes('--since') ? process.argv[process.argv.indexOf('--since') + 1] : null;
const line = (r) => `  ${r.rule_id} [${r.status}] sup=${r.support_count} con=${r.contradict_count}  ${(ruleText[r.rule_id] || '').slice(0, 70)}`;

if (since) {
  const ch = RS.changedSince(state, since);
  console.log(`\nChanged since ${since}: ${ch.length}`); ch.forEach(r => console.log(line(r)));
  console.log(''); process.exit(0);
}

console.log('\nKnowledge Evolution — rule support state\n');
console.log(`Evidence-set links: ${support.links.length}  ·  rules: ${state.length}`);
const counts = state.reduce((a, r) => (a[r.status] = (a[r.status] || 0) + 1, a), {});
console.log('Status:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' · '));
const bucket = (name, list) => { console.log(`\n${name}: ${list.length}`); list.forEach(r => console.log(line(r))); };
bucket('▲ promotion-ready (→ verified mechanism)', RS.promotionReady(state));
bucket('▼ weakened / contradicted', RS.weakened(state));
bucket('• single-support (fragile)', RS.singleSupport(state));
bucket('○ asserted only (expert, no evidence yet)', RS.assertedOnly(state));
console.log('\n(link an Evidence Set: node scripts/rule_support.mjs link <rule_id> <evs_id> support|contradict --date D)\n');
