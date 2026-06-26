#!/usr/bin/env node
/**
 * Prediction CLI — the loop-closing layer (Fresco). Shows each rule's prediction, which are
 * open vs resolved, and the RuleSupport links that resolved predictions feed back.
 * Usage:
 *   npm run predictions                  # all predictions + open/resolved + loop-back links
 *   node scripts/predictions.mjs target WP-001
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const P = await import(pathToFileURL(path.resolve(root, 'lib/prediction.js')).href);

const preds = cfg('prediction_registry_v1.json').predictions || [];
const mode = process.argv[2];

if (mode === 'target') {
  const list = P.forTarget(preds, process.argv[3]);
  console.log(`\n${list.length} prediction(s) for ${process.argv[3]}:`);
  list.forEach(p => console.log(`  ${p.id} [${p.status}] ${p.prediction}`));
  console.log('');
} else {
  console.log('\nPrediction Registry — closing the learning loop\n');
  console.log(`Predictions: ${preds.length}  ·  open: ${P.open(preds).length}  ·  resolved: ${P.resolved(preds).length}`);
  for (const p of preds) console.log(`  ${p.id} → ${p.target} [${p.status}]  ${p.prediction}`);
  const links = P.ruleLinks(preds);
  console.log(`\nLoop-back into RuleSupport (from resolved predictions): ${links.length}`);
  links.forEach(l => console.log(`  ${l.evs_id} ${l.stance}s ${l.rule_id}`));
  if (!links.length) console.log('  (none resolved yet — predictions are open until an experiment returns)');
  console.log('\nFull loop: Engineering Rule → Prediction → Experiment → RuleSupport ↺\n');
}
