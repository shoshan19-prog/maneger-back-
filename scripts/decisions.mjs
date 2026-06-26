#!/usr/bin/env node
/**
 * Decision Library CLI (Fresco) — the Decision Authority layer + data-driven mechanism emergence.
 * Usage:
 *   npm run decisions                         # summary + watched patterns
 *   node scripts/decisions.mjs criterion "recoverability"   # decisions using a criterion
 *   node scripts/decisions.mjs candidates [--min 3]         # criteria recurring → mechanism candidates
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const DL = await import(pathToFileURL(path.resolve(root, 'lib/decisionLibrary.js')).href);

const lib = cfg('decision_library_v1.json');
const mech = cfg('mechanism_registry_v1.json');
const decisions = lib.decisions || [];
const mode = process.argv[2];
const arg = (k) => process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined;

if (mode === 'criterion') {
  const list = DL.byCriterion(decisions, process.argv[3] || '');
  console.log(`\n${list.length} decision(s) using "${process.argv[3]}":`);
  list.forEach(d => console.log(`  ${d.id} [${d.decision}] ${d.question} — ${d.authority}`));
  console.log('');
} else if (mode === 'candidates') {
  const min = Number(arg('--min')) || 3;
  const cands = DL.mechanismCandidates(decisions, { minDecisions: min });
  console.log(`\nMechanism candidates (criterion used in >= ${min} decisions): ${cands.length}`);
  cands.forEach(c => console.log(`  "${c.criterion}" ×${c.count}  decisions: ${c.decisions.join(', ')}`));
  if (!cands.length) console.log('  (none yet — need real decisions; mechanisms emerge from recurrence, not impression)');
  console.log('');
} else {
  console.log('\nDecision Library\n');
  console.log(`Decisions recorded: ${decisions.length}`);
  if (decisions.length) {
    const freq = DL.criterionFrequency(decisions);
    console.log('Criteria frequency:', Object.entries(freq).map(([k, v]) => `${k}=${v}`).join(' · ') || '(none)');
  }
  console.log(`\nMechanism Registry: ${(mech.mechanisms || []).length} mechanisms · ${(mech.watched_patterns || []).length} watched pattern(s)`);
  for (const w of (mech.watched_patterns || [])) console.log(`  [${w.status}] ${w.id}: ${w.statement}\n        based_on: ${w.based_on} — do_not_promote: ${w.do_not_promote}`);
  console.log('\n(node scripts/decisions.mjs criterion <name> | candidates [--min N])\n');
}
