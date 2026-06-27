/**
 * Tests for Experiment Linking (value = Knowledge Δ contribution). Run:
 *   node tests/experimentLink.test.mjs
 * Core checks: an experiment's value is its Δ contribution, not its link; a measurement matures
 * authority and lifts measurement coverage above 0%; a pre-registered-but-unrun experiment is
 * PROJECTED (not folded into the real state); experiments rank by projected Δ.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const F = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);
const S = await import(pathToFileURL(path.resolve(here, '../lib/formulaSchema.js')).href);
const D = await import(pathToFileURL(path.resolve(here, '../lib/knowledgeDelta.js')).href);
const X = await import(pathToFileURL(path.resolve(here, '../lib/experimentLink.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const sheet = (p, rows) => [`${p} ,FRESCO COLORS`, p, 'חומר,מנה,,אחוז,,ק"ג', ...rows, `שם המוצר ,${p}`].join('\n');
const formula = S.canonicalFormula(F.extractFormula(sheet('פ', ['0-0.8,1600,,70%,9600', 'wite cement,500,,30%,3000'])), { document_source: 'f' });
const fid = formula.formula_id;
const state = D.buildState([formula]);

t('a link-only experiment (no contribution) has value 0', () => {
  const v = X.experimentValue(state, { id: 'E-link', formula_id: fid, status: 'completed', actual_contribution: null });
  assert.equal(v.learning_value, 0);
  assert.equal(v.learned, false);
});

t('a measurement matures authority and lifts measurement coverage above 0%', () => {
  const exp = { id: 'E-meas', formula_id: fid, status: 'completed',
    actual_contribution: { authority: [{ formula_id: fid, material: 'wite cement', to: { field: 'objective', source: 'measurement' } }] } };
  const v = X.experimentValue(state, exp);
  assert.ok(v.learning_value >= 3);                 // an authority maturation
  assert.equal(v.measurement_coverage_from, 0);
  assert.ok(v.measurement_coverage_to > 0);
  assert.equal(v.learned, true);
});

t('evidence + boundary contribution scores higher (boundary weighted most)', () => {
  const exp = { id: 'E-rich', formula_id: fid, status: 'completed',
    actual_contribution: { evidence: { pull_off: 3 }, boundaries: [{ id: 'B-1', statement: 'PSD 0.8-1.4 works only below APP 24%' }] } };
  const v = X.experimentValue(state, exp);
  assert.equal(v.learning_value, 3 * 1 + 1 * 5);    // 3 evidence + 1 boundary
});

t('pre-registered experiment is PROJECTED, not folded into the real state', () => {
  const exp = { id: 'E-012', formula_id: fid, status: 'pre_registered',
    expected_contribution: { evidence: { char_density: 5 } } };
  const v = X.experimentValue(state, exp);
  assert.equal(v.projected, true);
  assert.equal(v.learning_value, 5);
  // applying COMPLETED only must NOT include the pre-registered one
  const after = X.applyCompleted(state, [exp]);
  assert.deepEqual(after.evidence, state.evidence);  // unchanged — projection is not reality
});

t('rankByValue orders experiments by projected/actual Δ (next-experiment lever)', () => {
  const exps = [
    { id: 'low', formula_id: fid, status: 'pre_registered', expected_contribution: { evidence: { ph: 1 } } },
    { id: 'high', formula_id: fid, status: 'pre_registered', expected_contribution: { boundaries: [{ id: 'B', statement: 'x' }], evidence: { char_density: 4 } } },
  ];
  const ranked = X.rankByValue(state, exps);
  assert.equal(ranked[0].experiment_id, 'high');
});

console.log(`\n${passed} passed`);
