/**
 * Tests for the Product-Spec extractor v2. Run: node tests/specExtract.test.mjs
 * Locks: case-insensitive label match, unit normalization (traceable), three-state status
 * (Present / External / Missing), and the document classifier — so scaling keeps the mapping.
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
  '3,PH ,7.6 -10',          // uppercase PH on purpose
  '4,בדיקת לובן ,#####',
  '5,משקל סגולי ,1.3- 1.5',
].join('\n');

const cementitious = [
  'הרבצה צמנטית FRESCO COLORS',
  'חומר,מנה,,אחוז',
  '0-700,1090,,54.61%',
  'cement,400,,20.04%',
  'HYDRATED LIME,25',
  'שם המוצר ,הרבצה צמנטית BST3',
  'משקל סגולי:,',
].join('\n');

t('classifies a liquid formula sheet with embedded QC', () => {
  const r = extractSpecs(liquid);
  assert.equal(r.family, 'liquid');
  assert.equal(r.document_type, 'Formula Sheet');
  assert.equal(r.product, 'B-4 אקרילי');
});

t('case-insensitive: uppercase "PH" still maps to ph', () => {
  const ph = extractSpecs(liquid).specification.ph;
  assert.ok(ph, 'ph extracted despite uppercase');
  assert.deepEqual(ph.value, { min: 7.6, max: 10, unit: 'pH' });
});

t('normalizes specific gravity g/cm3 -> kg/m3, keeps raw for traceability', () => {
  const d = extractSpecs(liquid).specification.density;
  assert.deepEqual(d.value, { min: 1300, max: 1500, unit: 'kg/m3' });
  assert.equal(d.evidence.normalization.raw, '1.3-1.5 g/cm3');
});

t('Evidence Layer: each spec keeps source_document + literal source_text + confidence', () => {
  const ph = extractSpecs(liquid, 'B-4', 'B-4 פריימר אקרילי.txt').specification.ph;
  assert.equal(ph.evidence.source_document, 'B-4 פריימר אקרילי.txt');
  assert.ok(/7\.6/.test(ph.evidence.source_text), 'literal evidence text retained');
  assert.equal(ph.confidence, 1.0);
});

t('qualitative checks go to present_non_standard, not specification', () => {
  const r = extractSpecs(liquid);
  const axes = r.present_non_standard.map(x => x.axis);
  for (const g of ['uniformity', 'consistency', 'whiteness']) assert.ok(axes.includes(g), g);
  assert.ok(!r.specification.whiteness);
});

t('Document Capability: cementitious compressive_strength is NOT-EXPECTED here (no false gap), routed', () => {
  const r = extractSpecs(cementitious);
  assert.equal(r.family, 'cementitious');
  assert.deepEqual(r.specification, {});
  assert.equal(r.missing.length, 0);                           // not a real gap on a Formula Sheet
  const cs = r.not_expected.find(e => e.axis === 'compressive_strength');
  assert.ok(cs, 'compressive_strength is not_expected, not missing');
  assert.ok(cs.route_to.includes('Product Specification') || cs.route_to.includes('QC Sheet'));
  assert.ok(r.document_capability.should_not_contain.includes('compressive_strength'));
});

t('Document Capability: a liquid sheet missing viscosity IS a real gap (doc can_contain it)', () => {
  const r = extractSpecs(liquid);                              // B-4 QC block has no viscosity
  assert.ok(r.missing.some(e => e.axis === 'wet_viscosity'), 'real Missing, not Not-Expected');
});

t('Measurement Ontology classifies each spec (domain/standard) and rides on gaps too', () => {
  const r = extractSpecs(liquid);
  assert.equal(r.specification.ph.classification.domain, 'Chemical');
  assert.equal(r.specification.density.classification.domain, 'Physical');
  const cs = extractSpecs(cementitious).not_expected.find(e => e.axis === 'compressive_strength');
  assert.equal(cs.classification.domain, 'Mechanical');
  assert.equal(cs.classification.standard, 'EN 1015-11');
});

console.log(`\n${passed} passed`);
