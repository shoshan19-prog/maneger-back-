#!/usr/bin/env node
/**
 * Gap CLI — classify a missing-information gap into one of the three types and, for a Discovery
 * Gap, suggest the shallowest discriminating observation depth. The Information-gap protocol made
 * executable: it stops the system from reflexively asking the user OR ordering a lab run.
 * Usage:
 *   npm run gap                                         # show the three types + the depth ladder
 *   node scripts/gap.mjs classify --can-answer          # → knowledge_gap
 *   node scripts/gap.mjs classify --no-data             # → evidence_gap
 *   node scripts/gap.mjs classify --has-data            # data exists, unresolved → discovery_gap
 *   node scripts/gap.mjs example                        # the worked example (viscosity dropped)
 *   node scripts/gap.mjs discriminate                   # run the Discriminability worked example
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const G = await import(pathToFileURL(path.resolve(root, 'lib/gapClassifier.js')).href);
const D = await import(pathToFileURL(path.resolve(root, 'lib/discriminability.js')).href);

const depths = cfg('discovery_depths_v1.json');
const argv = process.argv.slice(2);
const mode = argv[0];
const has = (f) => argv.includes(f);

if (mode === 'classify') {
  const g = G.classifyGap({
    user_can_answer: has('--can-answer'),
    has_data: has('--has-data') || has('--can-answer'),
    hypotheses_resolved: has('--resolved'),
  });
  console.log(`\nGap type:  ${g.type || '(no gap)'}`);
  console.log(`Action:    ${g.action}`);
  console.log(`Reason:    ${g.reason}`);
  if (g.type === 'discovery_gap') {
    console.log('\nDepth ladder (shallow → deep):');
    for (const d of depths.depth_ladder) console.log(`  ${d.rank}. ${d.id}  [${d.cost}]  — ${d.reveals}`);
    console.log('\n→ Ask for the SHALLOWEST rung that discriminates the hypotheses, not a re-run.');
  }
  console.log('');
} else if (mode === 'discriminate') {
  const disc = cfg('discriminability_v1.json');
  const e = disc.worked_example;
  const r = D.assessDiscriminability(e.hypotheses, e.evidence_set_present, { ladder: depths.depth_ladder });
  console.log(`\nDiscriminability Assessment — the fourth primitive`);
  console.log(`  principle: ${disc.principle}`);
  console.log(`\n  Evidence Set present: ${e.evidence_set_present.join(', ')}`);
  console.log(`  Hypotheses: ${e.hypotheses.map(h => `${h.id} (${h.statement})`).join('  vs  ')}`);
  console.log(`  declared discriminators: ${e.hypotheses.map(h => `${h.id}→[${h.distinguished_by.join(',')}]`).join('  ')}`);
  console.log(`\n  → status: ${r.status}`);
  console.log(`  → ${r.message}`);
  if (r.suggested_depths) console.log(`  → shallowest declared-but-missing discriminator: ${r.suggested_depths[0].suggested_depth}`);
  console.log(`\n  Boundary: the system CHECKS declared discriminators; it never INFERS what discriminates.\n`);
} else if (mode === 'example') {
  const e = depths.worked_example;
  const r = G.recommend({
    user_can_answer: false, has_data: true, hypotheses_resolved: false,
    ladder: depths.depth_ladder,
    discriminates: (d) => d.id === e.suggested_depth,
  });
  console.log(`\nWorked example: "${e.observation}"`);
  console.log(`  competing: ${e.competing_hypotheses.join('  vs  ')}`);
  console.log(`  → ${r.type} · ${r.action}`);
  console.log(`  → suggested depth: ${r.suggested_depth}  (${e.note})\n`);
} else {
  console.log('\nThree gap types — choose the minimum-cost response before asking OR measuring:\n');
  for (const [k, v] of Object.entries(G.GAP_TYPES)) {
    const when = depths.gap_types[k]?.when || depths.gap_types[k]?.to || '';
    console.log(`  ${v.label.padEnd(14)} → ${v.action}${when ? `   (${when})` : ''}`);
  }
  console.log('\nDepth ladder for a Discovery Gap (shallow → deep):');
  for (const d of depths.depth_ladder) console.log(`  ${d.rank}. ${d.id}  [${d.cost}]  — ${d.reveals}`);
  console.log('\nRun `node scripts/gap.mjs example` for the worked case.\n');
}
