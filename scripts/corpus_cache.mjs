#!/usr/bin/env node
/**
 * Corpus cache / local snapshot — download the Drive sheets ONCE into a local corpus, then
 * run extractor / KPI / ground-truth against the snapshot (Fresco efficiency #2). Saves Drive
 * calls + tokens on every re-run, and — critically — lets us compare parser versions on the
 * EXACT same input (Evidence-first / reproducible).
 *
 * The corpus dir is git-ignored (.corpus/) because the raw sheets are proprietary
 * formulations. The agent writes .txt exports into .corpus/specsrc/ (via the Drive MCP);
 * this script records a deterministic manifest (sha1/bytes/lines) so a snapshot is auditable.
 *
 * Usage:
 *   node scripts/corpus_cache.mjs [--dir .corpus/specsrc]   # scan + (re)write manifest, print status
 */
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const dirArg = process.argv.includes('--dir') ? process.argv[process.argv.indexOf('--dir') + 1] : '.corpus/specsrc';
const dir = path.resolve(dirArg);
const manifestPath = path.resolve(path.dirname(dir), 'manifest.json');

if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); console.log(`created empty corpus dir: ${dirArg}`); }
const files = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort();

const entries = files.map(f => {
  const buf = fs.readFileSync(path.join(dir, f));
  return { file: f, bytes: buf.length, lines: buf.toString('utf8').split('\n').length, sha1: createHash('sha1').update(buf).digest('hex').slice(0, 12) };
});

// Immutability guard (Reference Corpus = strategic asset; never modify source). Compare to the
// prior manifest and flag any changed or removed snapshot — the corpus should be append-only.
if (fs.existsSync(manifestPath)) {
  const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const prevById = Object.fromEntries((prev.files || []).map(e => [e.file, e.sha1]));
  const nowById = Object.fromEntries(entries.map(e => [e.file, e.sha1]));
  const changed = entries.filter(e => prevById[e.file] && prevById[e.file] !== e.sha1).map(e => e.file);
  const removed = Object.keys(prevById).filter(f => !(f in nowById));
  if (changed.length) console.warn(`⚠ source modified (corpus should be append-only): ${changed.join(', ')}`);
  if (removed.length) console.warn(`⚠ snapshot removed since last manifest: ${removed.join(', ')}`);
}
const manifest = { corpus: dirArg, count: entries.length, files: entries, note: 'git-ignored proprietary corpus snapshot; deterministic record for reproducible parser runs' };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Corpus snapshot: ${entries.length} docs in ${dirArg}`);
entries.forEach(e => console.log(`  ${e.sha1}  ${String(e.bytes).padStart(6)}B  ${e.file}`));
console.log(`manifest -> ${path.relative(process.cwd(), manifestPath)}`);
console.log(entries.length ? 'Reuse: point extract_specs.mjs / spec_kpi.mjs at this dir.' : 'Empty — have the agent export Drive sheets into it first.');
