#!/usr/bin/env node
/**
 * Evolution Engine CLI — turns a version timeline into a TRANSITION stream and surfaces the
 * patterns above it: trends (recurring changes), strategies (co-occurring moves), and decision
 * chains (problem→fix). Reads a versions JSON (default: the intumescent journey in .corpus, the
 * git-ignored proprietary corpus). Prints aggregates only.
 * Usage:
 *   npm run evolution
 *   node scripts/evolution.mjs .corpus/drive/intumescent_versions.json
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, '..');
const E = await import(pathToFileURL(path.resolve(root, 'lib/evolutionEngine.js')).href);

const file = path.resolve(root, process.argv[2] || '.corpus/drive/intumescent_versions.json');
if (!fs.existsSync(file)) { console.error(`No versions file: ${file}`); process.exit(1); }
const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const versions = Array.isArray(raw) ? raw : (raw.versions || []);

const transitions = E.buildTransitions(versions);
const roots = versions.filter(v => !E.resolveParent(v, versions)).length;

console.log(`\nEvolution Engine — the transition is the unit of learning\n`);
console.log(`  versions: ${versions.length}  ·  transitions (decision edges): ${transitions.length}  ·  lineage roots: ${roots}`);

// Decision Δ distribution
const dec = transitions.reduce((a, t) => (a[t.decision.status] = (a[t.decision.status] || 0) + 1, a), {});
console.log(`  decision status: ${Object.entries(dec).map(([k, v]) => `${k} ${v}`).join(' · ')}`);

// TRENDS — recurring changes (family + material)
const rec = E.recurringChanges(transitions, { min: 3 });
console.log(`\nTRENDS — changes that recur (edit → trend):`);
console.log(`  by family:   ${rec.family.slice(0, 10).map(r => `${r.token}×${r.count}`).join('  ')}`);
console.log(`  by material: ${rec.material.slice(0, 10).map(r => `${r.token}×${r.count}`).join('  ')}`);

// STRATEGIES — co-occurring family moves
const co = E.coOccurringMoves(transitions, { min: 3 });
console.log(`\nSTRATEGIES — family moves that travel together (formula → strategy):`);
co.slice(0, 10).forEach(c => console.log(`  ${c.count}×  ${c.combo}`));

// DECISION CHAINS — problem → fix
const pf = E.problemFixes(transitions);
console.log(`\nDECISION CHAINS — problem → accompanying move:`);
console.log(`  problems tagged: ${Object.entries(pf.byProblem).map(([k, v]) => `${k} ${v}`).join(' · ') || '(none)'}`);
pf.events.slice(0, 4).forEach(e => console.log(`  [${e.problem}] ${e.transition}  moves: ${e.moves.join(',') || '—'}\n     "${(e.quote || '').slice(0, 90)}"`));

console.log(`\nReading: the version is a snapshot; the transition is the learning. ${transitions.length} transitions`);
console.log(`carry the four Δ types (composition/process/reasoning/decision). Link these to fire results`);
console.log(`and each transition gains a performance outcome — "which CHANGES improved fire endurance".\n`);
