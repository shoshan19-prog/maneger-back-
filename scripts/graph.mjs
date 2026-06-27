#!/usr/bin/env node
/**
 * Knowledge Graph CLI — builds the DERIVED graph over the canonical formulas and answers the
 * chemist's questions. Reads .corpus/formulas_v1.json (proprietary); prints aggregates only
 * (counts, fractions, source mix) — no full composition leaks to the terminal/log.
 * Usage:
 *   npm run graph                        # stats + shared PSD + co-occurrence + multi-role + authority
 *   node scripts/graph.mjs roles "<material>"
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const G = await import(pathToFileURL(path.resolve(root, 'lib/knowledgeGraph.js')).href);

const file = path.join(root, '.corpus', 'formulas_v1.json');
if (!fs.existsSync(file)) { console.error('No .corpus/formulas_v1.json — run `npm run formulas` first.'); process.exit(1); }
const formulas = JSON.parse(fs.readFileSync(file, 'utf8')).formulas.map(f => f.canonical).filter(Boolean);
const g = G.buildGraph(formulas);

const mode = process.argv[2];
if (mode === 'roles') {
  const mat = process.argv[3];
  const roles = G.rolesOfMaterial(g, mat);
  console.log(`\nRoles of "${mat}" across formulas:`);
  roles.forEach(r => console.log(`  ${r.role}: ${r.formulas.length} formula(s)`));
  console.log('');
} else {
  const byType = [...g.nodes.values()].reduce((a, n) => (a[n.type] = (a[n.type] || 0) + 1, a), {});
  console.log('\nKnowledge Graph (derived from canonical formulas — not stored)\n');
  console.log(`  nodes: ${g.nodes.size}  ·  edges: ${g.edges.length}`);
  console.log(`  by type: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(' · ')}`);

  console.log('\nFormulas sharing a PSD fraction:');
  const shared = G.formulasSharingPsd(g);
  shared.length ? shared.forEach(s => console.log(`  ${s.fraction}: ${s.formulas.length} formulas`)) : console.log('  (none)');

  console.log('\nTop co-occurring ingredient pairs:');
  G.coOccurringIngredients(g, { min: 2 }).slice(0, 8).forEach(c => console.log(`  ${c.count}×  ${c.pair}`));

  console.log('\nMaterials with MORE THAN ONE role (role is formula-scoped):');
  const multi = G.materialsWithMultipleRoles(g);
  multi.length ? multi.forEach(m => console.log(`  ${m.material}: ${m.roles.join(', ')}`)) : console.log('  (none in this corpus — each material plays one role so far)');

  const cov = G.authorityCoverage(g);
  console.log('\nSource-authority coverage (how much knowledge is measurement-backed?):');
  console.log(`  by source: ${Object.entries(cov.by_source_pct).map(([k, v]) => `${k} ${v}%`).join(' · ')}`);
  console.log(`  by field:  ${Object.entries(cov.by_field_pct).map(([k, v]) => `${k} ${v}%`).join(' · ')}`);
  console.log(`  → measurement-backed: ${cov.by_source_pct.measurement || 0}%  (0% until experiment/QC data enters — honest)`);
  console.log('\nThe tail (Functional Interface → Process → Measurement → Performance) is pending until process data exists.\n');
}
