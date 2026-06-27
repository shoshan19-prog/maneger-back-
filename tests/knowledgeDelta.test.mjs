/**
 * Tests for the Knowledge Δ Engine. Run: node tests/knowledgeDelta.test.mjs
 * Core checks: the five Δ types are classified separately; Authority Δ captures maturation
 * (interpreted→objective(measurement)); measurement coverage shift is reported (0% → 18%);
 * "learned" distinguishes real learning (authority/boundary/evidence) from mere composition edits.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const F = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);
const S = await import(pathToFileURL(path.resolve(here, '../lib/formulaSchema.js')).href);
const D = await import(pathToFileURL(path.resolve(here, '../lib/knowledgeDelta.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const sheet = (product, rows) => [`${product} ,FRESCO COLORS`, product, 'חומר,מנה,,אחוז,,ק"ג', ...rows, `שם המוצר ,${product}`].join('\n');
const F4 = S.canonicalFormula(F.extractFormula(sheet('פ', ['0-0.8,1600,,50%,9600', 'wite cement,500,,30%,3000', 'CaCO3,200,,20%,1200'])), { document_source: 'v4' });
const F5 = S.canonicalFormula(F.extractFormula(sheet('פ', ['0-0.8,1600,,55%,9600', 'wite cement,450,,30%,2700', 'APP,150,,15%,900'])), { document_source: 'v5' });

t('authorityMaturity ladder: pending<interpreted<objective(doc)<objective(measurement)', () => {
  assert.ok(D.authorityMaturity({ field: 'pending', source: 'unknown' }) < D.authorityMaturity({ field: 'interpreted', source: 'heuristic' }));
  assert.ok(D.authorityMaturity({ field: 'interpreted', source: 'heuristic' }) < D.authorityMaturity({ field: 'objective', source: 'document' }));
  assert.ok(D.authorityMaturity({ field: 'objective', source: 'document' }) < D.authorityMaturity({ field: 'objective', source: 'measurement' }));
});

t('Identity Δ: new material APP appears (V4→V5)', () => {
  const d = D.computeDelta(D.buildState([F4]), D.buildState([F5]));
  // same formula_id (same product, unversioned) → composition Δ, and APP is a new material
  assert.ok(d.identity.new_materials.includes('app'));
});

t('Composition Δ: CaCO3 removed, APP added, cement re-proportioned/percent', () => {
  const d = D.computeDelta(D.buildState([F4]), D.buildState([F5]));
  assert.ok(d.composition.removed.some(x => /caco3/i.test(x.material)));
  assert.ok(d.composition.added.some(x => /app/i.test(x.material)));
  assert.ok(d.composition.percent_changed.some(x => /0-0\.8/.test(x.material))); // 50%→55%
});

t('Authority Δ: a role maturing interpreted → objective(measurement) is counted as matured', () => {
  // same state, but in curr the binder role for cement is backed by a measurement
  const prev = D.buildState([F4]);
  const curr = JSON.parse(JSON.stringify(F4)); // clone
  const role = curr.functional_roles.find(r => r.role === 'binder');
  role.authority = { field: 'objective', source: 'measurement' };
  const d = D.computeDelta(prev, D.buildState([curr]));
  assert.equal(d.authority.matured.length, 1);
  assert.equal(d.summary.learned, true);
});

t('Boundary Δ: a newly declared boundary is detected', () => {
  const prev = D.buildState([F4], { boundaries: [] });
  const curr = D.buildState([F4], { boundaries: [{ id: 'B-1', statement: 'PSD 0.8-1.4 works only below APP 24%' }] });
  const d = D.computeDelta(prev, curr);
  assert.equal(d.boundary.new.length, 1);
  assert.equal(d.summary.learned, true);
});

t('Evidence Δ: +3 pull-off, +2 viscosity counted by axis', () => {
  const prev = D.buildState([F4], { evidence: { pull_off: 1 } });
  const curr = D.buildState([F4], { evidence: { pull_off: 4, wet_viscosity: 2 } });
  const d = D.computeDelta(prev, curr);
  assert.equal(d.evidence.added.pull_off, 3);
  assert.equal(d.evidence.added.wet_viscosity, 2);
  assert.equal(d.evidence.total, 5);
});

t('measurement coverage shift is reported (0% → 18%-style)', () => {
  // prev: all interpreted/heuristic (0% measurement). curr: ~1/6 datums measurement-backed.
  const prev = D.buildState([F4]); // 3 roles, none measurement
  const cov0 = D.measurementCoverage(prev);
  const curr = JSON.parse(JSON.stringify(F4));
  curr.functional_roles[0].authority = { field: 'objective', source: 'measurement' };
  const cov1 = D.measurementCoverage(D.buildState([curr]));
  assert.equal(cov0, 0);
  assert.ok(cov1 > 0);
  const d = D.computeDelta(prev, D.buildState([curr]));
  assert.ok(d.summary.measurement_coverage_delta > 0);
});

t('learned=false for a pure composition edit (no authority/boundary/evidence change)', () => {
  const d = D.computeDelta(D.buildState([F4]), D.buildState([F5]));
  assert.equal(d.summary.learned, false); // ingredients changed, but nothing MATURED
  assert.ok(d.summary.total_changes > 0);  // still a change, just not "learning"
});

console.log(`\n${passed} passed`);
