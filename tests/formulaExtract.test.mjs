/**
 * Tests for the Formula Extractor. Run: node tests/formulaExtract.test.mjs
 * Fixtures are SYNTHETIC (no proprietary formulas committed) but mirror the real sheet structure:
 * a header row, ingredient rows (material, batch, %, kg), PSD fractions, a binder, then a footer.
 * Core checks: row values are read objectively; PSD fractions are tagged (David's identity var);
 * percent_sum is a self-audit that catches a dropped row.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const F = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const CEMENTITIOUS = [
  'דוגמא ,FRESCO COLORS',
  'טיח דוגמא',
  'חומר,מנה,,אחוז,,ק"ג',
  '0-0.8,1600,,43.77%,9600.00',
  '0.8-1.4,800,,21.88%,4800.00',
  'wite cement,500,,13.68%,3000.00',
  'HYDRATED LIME,25,,0.68%,150.00',
  'M.CILULOS 60000,1.5,,0.04%,9.00',
  '-200,700,,19.95%,4200.00',
  'שם המוצר ,טיח דוגמא',
  'משקל סגולי:,',
  'שם לבורנט ,דוד',
].join('\n');

t('reads ingredient rows objectively (name, batch, percent, quantity)', () => {
  const r = F.extractFormula(CEMENTITIOUS);
  assert.equal(r.ingredient_count, 6);
  const cement = r.ingredients.find(i => /cement/i.test(i.name));
  assert.equal(cement.batch, 500);
  assert.equal(cement.percent, 13.68);
  assert.equal(cement.quantity, 3000);
});

t('tags PSD fractions (range AND mesh) as the identity variable', () => {
  const r = F.extractFormula(CEMENTITIOUS);
  const psdNames = r.psd_design.map(i => i.name).sort();
  assert.deepEqual(psdNames, ['-200', '0-0.8', '0.8-1.4']);
});

t('tags binders (cement / lime) as the chemical system', () => {
  const r = F.extractFormula(CEMENTITIOUS);
  const binders = r.binders.map(i => i.name).sort();
  assert.deepEqual(binders, ['HYDRATED LIME', 'wite cement']);
});

t('does NOT mistake a binder code like B-100 for a PSD fraction', () => {
  assert.equal(F.classifyRole('B-100'), 'additive');
  assert.equal(F.classifyRole('0-0.8'), 'psd_fraction');
  assert.equal(F.classifyRole('SILICA 0-0.8'), 'psd_fraction');
  assert.equal(F.classifyRole('wite cement'), 'binder');
});

t('percent_sum self-audit: complete formula sums ~100', () => {
  const r = F.extractFormula(CEMENTITIOUS);
  assert.equal(r.percent_ok, true);  // 43.77+21.88+13.68+0.68+0.04+19.95 = 100.00
});

t('percent_sum self-audit catches a dropped row (<100)', () => {
  const broken = CEMENTITIOUS.replace('-200,700,,19.95%,4200.00\n', '');
  const r = F.extractFormula(broken);
  assert.equal(r.percent_ok, false);
});

t('stops at the QC / footer block — no metadata rows leak in', () => {
  const r = F.extractFormula(CEMENTITIOUS);
  assert.ok(!r.ingredients.some(i => /שם|משקל|לבורנט/.test(i.name)));
});

t('liquid sheet: percent column + quantities column', () => {
  const liquid = [
    'B-4 אקרילי', 'מס\' מנה 25',
    'חומר,מנה,,אחוז,כמויות למנה',
    'מים (שקילה ידנית ),257,,30.55%,822.693',
    'אמולסיה 7172,140,,16.64%,448.160',
    'בדיקות ,,אישור מעבדה ,הוראות מדבקה',
    '3,PH ,7.6 -10',
  ].join('\n');
  const r = F.extractFormula(liquid);
  assert.equal(r.ingredient_count, 2);                  // QC block excluded
  assert.equal(r.ingredients[0].percent, 30.55);
  assert.equal(r.ingredients[0].quantity, 822.693);
});

console.log(`\n${passed} passed`);
