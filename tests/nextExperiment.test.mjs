/** Tests for the next-experiment proposer. Run: node tests/nextExperiment.test.mjs */
import assert from 'node:assert';
import fs from 'fs'; import path from 'path';
import { pathToFileURL } from 'url';
const here = path.dirname(new URL(import.meta.url).pathname);
const { proposeExperiments } = await import(pathToFileURL(path.resolve(here, '../lib/nextExperiment.js')).href);
const mech = JSON.parse(fs.readFileSync(path.resolve(here, '../config/mechanism_hypothesis_seed_v1.json'),'utf8')).rows;
const coup = JSON.parse(fs.readFileSync(path.resolve(here, '../config/coupling_registry_v1.json'),'utf8')).couplings;

let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };

const ranked = proposeExperiments({ mechanisms: mech, couplings: coup });
t('returns a ranked, non-empty queue', () => {
  assert.ok(ranked.length >= mech.length);
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i-1].score >= ranked[i].score);
});
t('FIRE_DRY (weak base n=3, high impact) ranks at/near the top', () => {
  const top = ranked.filter(r => r.kind === 'mechanism_isolation').slice(0, 2).map(r => r.id);
  assert.ok(top.includes('FIRE_DRY'));
});
t('verified items would be skipped', () => {
  const r = proposeExperiments({ mechanisms: [{property:'X', status:'VERIFIED', to_verify:'x'}], couplings: [{id:'CZ', evidence_level:'Verified'}] });
  assert.equal(r.length, 0);
});
t('every item carries an experiment + rationale', () => {
  for (const r of ranked) { assert.ok(r.experiment && r.rationale && typeof r.score === 'number'); }
});
console.log(`\n${passed} passed`);
