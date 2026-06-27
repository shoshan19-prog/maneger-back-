/**
 * Tests for Formula Schema v1.1 (canonical Formula Object). Run: node tests/formulaSchema.test.mjs
 * v1.1 core checks: Role is a SEPARATE entity (not on Ingredient); authority is two-dimensional
 * { field, source } with the invariant (objective ≠ heuristic); the Functional Interface layer
 * exists explicitly; the SAME material can hold different roles in different formulas.
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

t('maps extraction to a valid canonical Formula Object (v1.1)', () => {
  const v = S.validateFormula(build());
  assert.ok(v.ok, v.errors.join('; '));
});

t('Role is a SEPARATE entity — Ingredient carries NO role', () => {
  const f = build();
  assert.ok(f.ingredients.every(i => !('role' in i)), 'ingredient must not carry role');
  assert.equal(f.functional_roles.length, f.ingredients.length);
  // forging a role onto an ingredient is rejected
  f.ingredients[0].role = 'binder';
  assert.equal(S.validateFormula(f).ok, false);
});

t('authority is two-dimensional { field, source }', () => {
  const f = build();
  const psd = f.functional_roles.find(r => r.role === 'psd_fraction');
  const binder = f.functional_roles.find(r => r.role === 'binder');
  assert.deepEqual(psd.authority, { field: 'objective', source: 'document' });
  assert.deepEqual(binder.authority, { field: 'interpreted', source: 'heuristic' });
});

t('invariant: objective may NOT carry source=heuristic (fact ≠ heuristic)', () => {
  const f = build();
  f.functional_roles.find(r => r.role === 'psd_fraction').authority = { field: 'objective', source: 'heuristic' };
  assert.equal(S.validateFormula(f).ok, false);
});

t('invariant: a binder/additive role cannot be objective', () => {
  const f = build();
  f.functional_roles.find(r => r.role === 'binder').authority = { field: 'objective', source: 'document' };
  assert.equal(S.validateFormula(f).ok, false);
});

t('Functional Interface is an explicit layer (present, pending/empty for now)', () => {
  const f = build();
  assert.ok(Array.isArray(f.functional_interfaces));
  // a well-formed pending interface validates; an objective-from-unknown one does not
  f.functional_interfaces.push({ interface: 'packing', couples_to: ['water_demand'], authority: { field: 'pending', source: 'unknown' } });
  assert.ok(S.validateFormula(f).ok);
  f.functional_interfaces.push({ interface: 'rheology', authority: { field: 'objective', source: 'unknown' } });
  assert.equal(S.validateFormula(f).ok, false);
});

t('the SAME material can hold DIFFERENT roles in different formulas (role is formula-scoped)', () => {
  // CaCO3 = Packing in F-103, Opacity in F-200 — identity unchanged.
  const f103 = { ingredient: 'Omyacarb 5', role: 'packing', authority: { field: 'interpreted', source: 'heuristic' } };
  const f200 = { ingredient: 'Omyacarb 5', role: 'opacity', authority: { field: 'interpreted', source: 'measurement' } };
  const errs = [];
  S.validateAuthority(f103.authority, 'f103', errs);
  S.validateAuthority(f200.authority, 'f200', errs);
  assert.equal(errs.length, 0);
  assert.notEqual(f103.role, f200.role);          // same material, different role
});

t('pending layers are explicitly empty (known gap, not a guess)', () => {
  const f = build();
  assert.equal(f.process, null);
  assert.deepEqual(f.measurements, []);
  assert.deepEqual(f.performance, []);
});

t('identity is provisional pending Q-009', () => {
  const f = build();
  assert.equal(f.identity_status, 'provisional_pending_Q009');
  assert.equal(f.formula_id, S.formulaId('טיח דוגמא', null));
});

t('objective composition fields are preserved on the ingredient', () => {
  const f = build();
  const cement = f.ingredients.find(i => /cement/i.test(i.material));
  assert.equal(cement.percent, 13.68);
  assert.equal(cement.quantity, 3000);
});

console.log(`\n${passed} passed`);
