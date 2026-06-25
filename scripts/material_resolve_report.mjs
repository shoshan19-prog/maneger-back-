#!/usr/bin/env node
// Report how many material names resolve to a canonical id (Phase A5 dedup readiness).
// Usage: node material_resolve_report.mjs <names.txt>   (one name per line)
// When the DB is reachable, feed it the distinct experiment_materials.material_id values.
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
const here = path.dirname(new URL(import.meta.url).pathname);
const { resolveMaterial } = await import(pathToFileURL(path.resolve(here, '../lib/aliasResolver.js')).href);
const file = process.argv[2];
if (!file) { console.error('Usage: node material_resolve_report.mjs <names.txt>'); process.exit(2); }
const names = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
const resolved = [], unresolved = [], ambiguous = [];
for (const n of names) { const h = resolveMaterial(n);
  if (!h) unresolved.push(n); else if (h.ambiguous) ambiguous.push(n); else resolved.push([n, h.material_id]); }
console.log(`names: ${names.length}  resolved: ${resolved.length}  unresolved: ${unresolved.length}  ambiguous: ${ambiguous.length}`);
resolved.forEach(([n, id]) => console.log(`  ✓ ${n} -> ${id}`));
unresolved.forEach(n => console.log(`  ✗ ${n} (needs a canonical entry or alias — lab decision)`));
ambiguous.forEach(n => console.log(`  ? ${n} (alias collides between materials — lab decision)`));
