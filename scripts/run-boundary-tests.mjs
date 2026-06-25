#!/usr/bin/env node
// Runs every tests/*.test.mjs and aggregates pass/fail. Exit 1 if any fails.
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const dir = path.resolve(here, '../tests');
const files = readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();
let total = 0, failed = 0;
for (const f of files) {
  const r = spawnSync('node', [path.join(dir, f)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const m = out.match(/(\d+) passed/);
  const n = m ? Number(m[1]) : 0; total += n;
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? '✓' : '✗'} ${f}  (${n} passed)`);
  if (!ok) console.log(out.split('\n').filter(l => l.includes('✗')).join('\n'));
}
console.log(`\n${total} assertions passed across ${files.length} files; ${failed} file(s) failed.`);
process.exit(failed ? 1 : 0);
