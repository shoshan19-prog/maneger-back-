/**
 * Tests for the derived Knowledge Graph. Run: node tests/knowledgeGraph.test.mjs
 * Core checks: the graph is DERIVED from canonical formulas; it answers the chemist's questions
 * (shared PSD, co-occurring ingredients, a material's multiple roles); edges keep two-dim authority
 * so a measurement-only subgraph is takeable; version diff reports adds/removes/role shifts.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const F = await import(pathToFileURL(path.resolve(here, '../lib/formulaExtract.js')).href);
const S = await import(pathToFileURL(path.resolve(here, '../lib/formulaSchema.js')).href);
const G = await import(pathToFileURL(path.resolve(here, '../lib/knowledgeGraph.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const sheet = (product, rows) => [`${product} ,FRESCO COLORS`, product, 'חומר,מנה,,אחוז,,ק"ג', ...rows, `שם המוצר ,${product}`].join('\n');
const F1 = S.canonicalFormula(F.extractFormula(sheet('פ-1', ['0-0.8,1600,,50%,9600', 'wite cement,500,,30%,3000', 'Omyacarb 5,200,,20%,1200'])), { document_source: 'f1.txt' });
const F2 = S.canonicalFormula(F.extractFormula(sheet('פ-2', ['0-0.8,1600,,60%,9600', 'HYDRATED LIME,200,,40%,1200'])), { document_source: 'f2.txt' });
const g = G.buildGraph([F1, F2]);

t('graph is derived: nodes for formulas, components, roles, psd', () => {
  const types = new Set([...g.nodes.values()].map(n => n.type));
  assert.ok(types.has('Formula') && types.has('Component') && types.has('FunctionalRole') && types.has('PSDFraction'));
});

t('formulasSharingPsd finds the shared 0-0.8 fraction', () => {
  const shared = G.formulasSharingPsd(g);
  const frac = shared.find(s => s.fraction === '0-0.8');
  assert.ok(frac && frac.formulas.length === 2);
});

t('coOccurringIngredients counts pairs across formulas', () => {
  const co = G.coOccurringIngredients(g, { min: 1 });
  assert.ok(co.some(c => c.pair.includes('0-0.8')));
});

t('rolesOfMaterial / multiple roles: same material, different roles', () => {
  // Build two formulas where Omyacarb 5 is given different roles (formula-scoped role).
  const a = S.canonicalFormula({ product: 'A', family: 'cementitious', ingredients: [{ name: 'Omyacarb 5', percent: 10, role: 'additive' }], psd_design: [], binders: [], additives: [{ name: 'Omyacarb 5' }], percent_sum: 10, percent_ok: false }, { document_source: 'a' });
  const b = S.canonicalFormula({ product: 'B', family: 'cementitious', ingredients: [{ name: 'Omyacarb 5', percent: 10, role: 'psd_fraction' }], psd_design: [{ name: 'Omyacarb 5' }], binders: [], additives: [], percent_sum: 10, percent_ok: false }, { document_source: 'b' });
  const g2 = G.buildGraph([a, b]);
  const roles = G.rolesOfMaterial(g2, 'Omyacarb 5');
  assert.equal(roles.length, 2);
  assert.equal(G.materialsWithMultipleRoles(g2).length, 1);
});

t('edges carry two-dimensional authority; measurement subgraph is takeable', () => {
  const contains = g.edges.find(e => e.type === 'contains');
  assert.deepEqual(contains.authority, { field: 'objective', source: 'document' });
  // no measurement-sourced edges yet → measurement subgraph is empty (honest: 0% measurement-backed)
  assert.equal(G.subgraph(g, { source: 'measurement' }).edges.length, 0);
});

t('authorityCoverage reports source mix (document + heuristic, 0 measurement)', () => {
  const cov = G.authorityCoverage(g);
  assert.ok(cov.by_source.document > 0);
  assert.ok(cov.by_source.heuristic > 0);
  assert.equal(cov.by_source.measurement || 0, 0);
});

t('diffFormulas: V4 → V5 reports adds, removes, percent + role shifts', () => {
  const d = G.diffFormulas(F1, F2);
  assert.ok(d.removed.some(m => /cement/i.test(m)));   // cement dropped
  assert.ok(d.added.some(m => /LIME/i.test(m)));        // lime added
  assert.ok(d.percent_changed.some(c => c.material === '0-0.8')); // 50% → 60%
  assert.equal(d.changed, true);
});

console.log(`\n${passed} passed`);
