/**
 * Document Classifier tests. Covers the document_type branches that the Formula-Sheet corpus
 * can't exercise (TDS / MSDS / SOP), so the Document-Type dimension is validated even though
 * Ground-Truth round 1 is Formula Sheets only. Run: node tests/docClassify.test.mjs
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { classify } = await import(pathToFileURL(path.resolve(here, '../lib/docClassify.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

t('liquid Formula Sheet (QC block present)', () => {
  assert.deepEqual(classify('בדיקות\n3,PH ,7.6 -10\n5,משקל סגולי ,1.3-1.5'), { document_type: 'Formula Sheet', family: 'liquid', has_qc: true });
});

t('cementitious Formula Sheet (material table + cement markers, no QC)', () => {
  const r = classify('חומר,מנה,אחוז\ncement,400,20%\nHYDRATED LIME,25');
  assert.equal(r.document_type, 'Formula Sheet');
  assert.equal(r.family, 'cementitious');
});

t('TDS markers → Product Specification', () => {
  assert.equal(classify('Technical Data Sheet — ECO COAT').document_type, 'Product Specification');
  assert.equal(classify('נתונים טכניים: צפיפות, זמן ייבוש').document_type, 'Product Specification');
});

t('MSDS / SDS markers → Test Report', () => {
  assert.equal(classify('SAFETY DATA SHEET section 1').document_type, 'Test Report');
});

t('SOP markers → SOP', () => {
  assert.equal(classify('Standard Operating Procedure: mixing').document_type, 'SOP');
  assert.equal(classify('נוהל ערבוב והכנה').document_type, 'SOP');
});

t('unrecognized → Unknown (never silently a Formula Sheet)', () => {
  assert.equal(classify('hello world').document_type, 'Unknown');
});

console.log(`\n${passed} passed`);
