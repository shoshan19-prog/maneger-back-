/** Tests for the formulation rule-checker. Run: node tests/formulationRules.test.mjs */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { checkFormulation } = await import(pathToFileURL(path.resolve(here, '../lib/formulationRules.js')).href);

let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };
const find = (r, id) => r.checks.find(c => c.id === id);

t('a CE-003-like formulation (APP 27%) passes acid catalysis', () => {
  // uses trade names -> resolver canonicalizes
  const r = checkFormulation({ 'EXOLIT AP435': 0.274, 'CHARMOR PM 40': 0.106, 'MELAFINE': 0.106, 'ENCOR 367': 0.211, 'water': 0.303 });
  assert.equal(find(r, 'minimum_acid_catalysis').pass, true);   // 27.4% > 8
  assert.equal(find(r, 'minimum_acid_catalysis').value, 27.4);  // fraction -> percent
});

t('low-APP formulation fails acid catalysis (critical)', () => {
  const r = checkFormulation({ APP: 5, PER: 10, LATEX: 20 });   // already percent
  const c = find(r, 'minimum_acid_catalysis');
  assert.equal(c.pass, false);
  assert.equal(c.severity, 'critical');
  assert.equal(r.ok, false);
});

t('insufficient binder fails matrix integrity', () => {
  const r = checkFormulation({ APP: 20, PER: 10, LATEX: 5 });   // binder 5 < 10
  assert.equal(find(r, 'binder_matrix_integrity').pass, false);
});

t('reinforcement/expansion ratio rule fires when expansion present', () => {
  const r = checkFormulation({ APP: 20, MELAMINE: 10, LATEX: 15, NANO_CLAY: 1 }); // reinf 1 / exp 10 = 0.1 < 0.5
  const c = find(r, 'expansion_reinforcement_coupling');
  assert.ok(c);
  assert.equal(c.pass, false);
});

t('aliases collapse (MEL + MELAFINE counted as one MELAMINE)', () => {
  const r = checkFormulation({ APP: 20, MEL: 5, MELAFINE: 5, LATEX: 15 });
  // EXPANSION = MELAMINE only = 10 (both aliases summed), carbon includes it
  assert.equal(find(r, 'carbon_char_balance').value, 10);
});

t('reports rules that need measurement (not composition)', () => {
  const r = checkFormulation({ APP: 20, LATEX: 15 });
  assert.ok(r.needs_measurement.some(m => m.id === 'expansion_adhesion_mismatch'));
});

console.log(`\n${passed} passed`);
