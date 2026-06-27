/**
 * Tests for Formula Schema v1 (canonical Formula Object). Run: node tests/formulaSchema.test.mjs
 * Core checks: extraction maps to the schema; psd_fraction is the only OBJECTIVE role; pending
 * fields are explicitly empty (a known gap, not a guess); identity is provisional pending Q-009.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const F = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);
const S = await import(pathToFileURL(path.resolve(here, '../lib/formulaSchema.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const SHEET = [
  'דוגמא ,FRESCO COLORS', 'טיח דוגמא',
  'חומר,מנה,,אחוז,,ק"ג',
  '0-0.8,1600,,43.77%,9600.00',
  'wite cement,500,,13.68%,3000.00',
  'M.CILULOS 60000,1.5,,0.04%,9.00',
  '-200,700,,42.51%,4200.00',
  'שם המוצר ,טיח דוגמא',
].join('\n');

const build = () => S.canonicalFormula(F.extractFormula(SHEET), { document_source: 'דוגמא.txt', document_sha1: 'abc123', extracted_date: '2026-06-27' });

t('maps extraction to a valid canonical Formula Object', () => {
  const f = build();
  const v = S.validateFormula(f);
  assert.ok(v.ok, v.errors.join('; '));
});

t('psd_fraction is the only OBJECTIVE role; binder/additive are interpreted', () => {
  const f = build();
  const psd = f.ingredients.find(i => i.role === 'psd_fraction');
  const binder = f.ingredients.find(i => i.role === 'binder');
  assert.equal(psd.role_authority, 'objective');
  assert.equal(binder.role_authority, 'interpreted');
});

t('pending fields are explicitly empty (known gap, not a guess)', () => {
  const f = build();
  assert.equal(f.process, null);
  assert.deepEqual(f.linked_experiments, []);
  assert.deepEqual(f.observed_effects, []);
});

t('identity is provisional pending Q-009', () => {
  const f = build();
  assert.equal(f.identity_status, 'provisional_pending_Q009');
  assert.equal(f.formula_id, S.formulaId('טיח דוגמא', null));
});

t('objective composition fields are preserved', () => {
  const f = build();
  const cement = f.ingredients.find(i => /cement/i.test(i.material));
  assert.equal(cement.percent, 13.68);
  assert.equal(cement.quantity, 3000);
});

t('validate rejects a forged role_authority (objective claimed for a binder)', () => {
  const f = build();
  f.ingredients.find(i => i.role === 'binder').role_authority = 'objective';
  assert.equal(S.validateFormula(f).ok, false);
});

t('validate rejects missing provenance.document_source', () => {
  const f = build();
  f.provenance.document_source = '';
  assert.equal(S.validateFormula(f).ok, false);
});

console.log(`\n${passed} passed`);
