/**
 * Tests for the three-gap classifier. Run: node tests/gapClassifier.test.mjs
 * Core check: a Discovery Gap (data exists but does not discriminate) routes to "Requires Deeper
 * Observation" and picks the SHALLOWEST discriminating depth — not a re-run, not the deepest tool.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'node:fs';

const here = path.dirname(new URL(import.meta.url).pathname);
const G = await import(pathToFileURL(path.resolve(here, '../lib/gapClassifier.js')).href);
const depths = JSON.parse(readFileSync(path.resolve(here, '../config/discovery_depths_v1.json'), 'utf8'));

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('expert can answer → knowledge_gap → ask', () => {
  const g = G.classifyGap({ user_can_answer: true });
  assert.equal(g.type, 'knowledge_gap');
  assert.equal(g.action, 'ask one short question');
});

t('no data at all → evidence_gap → Requires Experimental Evidence', () => {
  const g = G.classifyGap({ user_can_answer: false, has_data: false });
  assert.equal(g.type, 'evidence_gap');
  assert.equal(g.action, 'Requires Experimental Evidence');
});

t('data exists but does not discriminate → discovery_gap → Requires Deeper Observation', () => {
  const g = G.classifyGap({ user_can_answer: false, has_data: true, hypotheses_resolved: false });
  assert.equal(g.type, 'discovery_gap');
  assert.equal(g.action, 'Requires Deeper Observation');
});

t('data discriminates already → no gap', () => {
  const g = G.classifyGap({ has_data: true, hypotheses_resolved: true });
  assert.equal(g.type, null);
});

t('knowledge_gap wins even when data exists (cheapest path first)', () => {
  const g = G.classifyGap({ user_can_answer: true, has_data: true, hypotheses_resolved: false });
  assert.equal(g.type, 'knowledge_gap');
});

t('recommendDepth picks the SHALLOWEST discriminating rung, not the deepest', () => {
  // recoverability_after_remix (rank 3) and SEM (rank 4) both discriminate → choose rank 3.
  const d = G.recommendDepth(depths.depth_ladder, (x) => ['recoverability_after_remix', 'SEM'].includes(x.id));
  assert.equal(d.id, 'recoverability_after_remix');
});

t('recommendDepth returns null when nothing discriminates → escalate', () => {
  assert.equal(G.recommendDepth(depths.depth_ladder, () => false), null);
});

t('recommend(): worked example (viscosity dropped, H1 reversible vs H2 irreversible)', () => {
  // The remix check separates reversible separation from irreversible failure.
  const r = G.recommend({
    user_can_answer: false, has_data: true, hypotheses_resolved: false,
    ladder: depths.depth_ladder,
    discriminates: (d) => d.id === 'recoverability_after_remix',
  });
  assert.equal(r.type, 'discovery_gap');
  assert.equal(r.action, 'Requires Deeper Observation');
  assert.equal(r.suggested_depth, depths.worked_example.suggested_depth); // recoverability_after_remix
});

t('recommend(): non-discovery gap passes through unchanged (no depth attached)', () => {
  const r = G.recommend({ user_can_answer: true, ladder: depths.depth_ladder });
  assert.equal(r.type, 'knowledge_gap');
  assert.equal(r.suggested_depth, undefined);
});

t('config ladder is ordered shallow→deep by rank', () => {
  const ranks = depths.depth_ladder.map(d => d.rank);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b));
});

console.log(`\n${passed} passed`);
