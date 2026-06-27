#!/usr/bin/env node
/**
 * Boundary / Replication CLI — shows each boundary's state on the candidate → supported →
 * established ladder, its confidence (replication-only), and whether any law is yet justified.
 * Usage: npm run boundaries
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const cfg = (n) => JSON.parse(fs.readFileSync(path.join(root, 'config', n), 'utf8'));
const R = await import(pathToFileURL(path.resolve(root, 'lib/replication.js')).href);

const boundaries = cfg('boundary_registry_v1.json').boundaries || [];
const s = R.summarize(boundaries);

console.log('\nBoundary Replication — candidate → supported → established (then Law)\n');
for (const b of boundaries) {
  console.log(`  ${b.id}  [${R.boundaryState(b)}]  confidence=${R.confidence(b)}  replications=${(b.replications || []).length}`);
  console.log(`     "${b.statement}"`);
  console.log(`     context: ${JSON.stringify(b.context)}`);
}
console.log(`\nStates: ${Object.entries(s.byState).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`Established boundaries: ${s.established}  ·  any law justified: ${s.any_law_justified}`);
console.log('\nReading: a law is born when a boundary SURVIVES independent replication, not when a');
console.log('Boundary Δ appears. Nothing is established yet — every boundary is a candidate awaiting');
console.log('independent replication under defined conditions. learning_value ≠ confidence.\n');
