/**
 * Tests for the Product-Spec extractor. Run: node tests/specExtract.test.mjs
 * Locks the QC-block parsing (T_relevance) so scaling to the rest of the Drive library
 * keeps the same mapping.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { extractSpecs } = await import(pathToFileURL(path.resolve(here, '../lib/specExtract.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const liquid = [
  'B-4 אקרילי',
  'בדיקות ,,אישור מעבדה',
  '1,בדיקת אחידות מדיה ,ניבדק,,שם מוצר ,B-4 אקרילי',
  '2,סמיכות חומר ,ניבדק',
  '3,PH ,7.6 -10',
  '4,בדיקת לובן ,#####',
  '5,משקל סגולי ,1.3- 1.5',
  '7,בדיקה של ישום החומר ,ניבדק',
].join('\n');

t('extracts the product name from the QC block', () => {
  assert.equal(extractSpecs(liquid).product, 'B-4 אקרילי');
});

t('parses PH range with spaces ("7.6 -10") into ph spec', () => {
  const ph = extractSpecs(liquid).specs.find(s => s.axis === 'ph');
  assert.ok(ph, 'ph spec present');
  assert.deepEqual([ph.min, ph.max], [7.6, 10]);
  assert.equal(ph.method, 'pH_meter_direct');
});

t('parses specific gravity ("1.3- 1.5") and flags the g/cm3 vs kg/m3 commensurability gap', () => {
  const d = extractSpecs(liquid).specs.find(s => s.axis === 'density');
  assert.deepEqual([d.min, d.max], [1.3, 1.5]);
  assert.equal(d.unit, 'g/cm3');
  assert.ok(/kg\/m3/.test(d.note), 'note flags conversion');
});

t('lists qualitative checks (no numeric scale) as gaps, not specs', () => {
  const r = extractSpecs(liquid);
  for (const g of ['uniformity', 'consistency', 'whiteness', 'applicability']) assert.ok(r.qualitative_gaps.includes(g), g);
  assert.ok(!r.specs.some(s => s.axis === 'whiteness'));
});

t('a present-but-empty QC row is "declared_empty", not a spec', () => {
  const emptyPh = 'WK-200\nשם מוצר ,כיחול עדין\n3,PH ,,,גוון\n5, משקל סגולי ,1.7- 1.9';
  const r = extractSpecs(emptyPh);
  assert.ok(r.declared_empty.includes('ph'));
  assert.ok(!r.specs.some(s => s.axis === 'ph'));
  assert.ok(r.specs.some(s => s.axis === 'density'));
});

console.log(`\n${passed} passed`);
