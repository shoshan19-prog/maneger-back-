/**
 * Tests for the Decision Library + data-driven mechanism emergence. Run: node tests/decisionLibrary.test.mjs
 * Synthetic decisions (not committed) prove the logic; the real config is empty by design.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const DL = await import(pathToFileURL(path.resolve(here, '../lib/decisionLibrary.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const decisions = [
  { id: 'DEC-1', decision: 'release', question: 'q', reasoning: 'r', evidence_used: ['EVS-1'], authority: 'David', criteria: ['recoverability after remix', 'pH'] },
  { id: 'DEC-2', decision: 'reject', question: 'q', reasoning: 'r', evidence_used: ['EVS-2'], authority: 'David', criteria: ['recoverability after remix'] },
  { id: 'DEC-3', decision: 'hold', question: 'q', reasoning: 'r', evidence_used: ['EVS-3'], authority: 'Rachel', criteria: ['recoverability after remix', 'viscosity'] },
];

t('validateDecision requires the reasoning fields', () => {
  assert.equal(DL.validateDecision(decisions[0]).valid, true);
  const bad = DL.validateDecision({ decision: 'release' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.includes('missing: reasoning'));
});

t('byCriterion finds decisions using a criterion (substring, case-insensitive)', () => {
  assert.equal(DL.byCriterion(decisions, 'Recoverability').length, 3);
  assert.equal(DL.byCriterion(decisions, 'pH').length, 1);
});

t('criterionFrequency tallies across decisions', () => {
  const f = DL.criterionFrequency(decisions);
  assert.equal(f['recoverability after remix'], 3);
  assert.equal(f['viscosity'], 1);
});

t('mechanismCandidates emerge only at the threshold (data, not impression)', () => {
  assert.deepEqual(DL.mechanismCandidates(decisions, { minDecisions: 3 }).map(c => c.criterion), ['recoverability after remix']);
  assert.equal(DL.mechanismCandidates(decisions, { minDecisions: 4 }).length, 0); // not enough recurrence
});

console.log(`\n${passed} passed`);
