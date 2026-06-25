#!/usr/bin/env node
// End-to-end GATE-B path on a payload: compute MME from the MME replicate group,
// derive the boundary on (density -> time_to_failure), render a boundary report.
// Usage: node gate_b_dry_run.mjs <payload.json> --input cond_density --spec 60
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const here = path.dirname(new URL(import.meta.url).pathname);
const { deriveBoundary } = await import(pathToFileURL(path.resolve(here,'../lib/boundaryDerive.js')).href);
const file = process.argv[2];
const inputAxis = process.argv.includes('--input') ? process.argv[process.argv.indexOf('--input')+1] : 'density';
const spec = Number(process.argv.includes('--spec') ? process.argv[process.argv.indexOf('--spec')+1] : 60);
const obs = (JSON.parse(fs.readFileSync(file,'utf8')).observations)||[];
const val = o => Number(o.value);
const dens = o => Number(o.conditions?.[inputAxis]?.value ?? o.conditions?.density?.value);
// MME = stddev of the MME replicate group (full-pipe variance = T_noise)
const mmeRows = obs.filter(o => /^MME/i.test(o.replicate_group||''));
const m = mmeRows.map(val); const mean = m.reduce((a,b)=>a+b,0)/m.length;
const mme = Math.sqrt(m.reduce((a,b)=>a+(b-mean)**2,0)/(m.length-1));
// scan points (exclude MME group); outcome from spec if not set
const pts = obs.filter(o => !/^MME/i.test(o.replicate_group||'')).map(o => ({
  input: dens(o), response: val(o), outcome: o.outcome_class || (val(o)>=spec?'works':'fails')
})).filter(p => Number.isFinite(p.input));
const b = deriveBoundary(pts, { mme });
const r = x => x==null?'—':(Math.round(x*100)/100);
console.log(`# GATE-B dry run — ${path.basename(file)}`);
console.log(`\nT_noise (MME) from ${m.length} repeats @ density 140: mean TTF=${r(mean)} min, sigma=${r(mme)} min`);
console.log(`Spec (T_relevance): PASS if TTF >= ${spec} min`);
console.log(`Scan points: ${pts.length}  (${pts.map(p=>p.input+'->'+p.response+'/'+p.outcome[0]).join(', ')})`);
console.log(`\n## Derived boundary (density -> time_to_failure)`);
console.log(`  direction:   ${b.direction}`);
console.log(`  boundary:    density = ${r(b.boundary)} kg/m3`);
console.log(`  interval:    [${b.interval?.map(r).join(', ')}]`);
console.log(`  sigma(bnd):  ${r(b.sigma)} kg/m3   (= MME / |slope ${r(b.slope)}|)`);
console.log(`  95% CI:      [${b.confidence_interval?.map(r).join(', ')}] kg/m3`);
console.log(`  separable:   ${b.separable}   monotonic: ${b.monotonic}`);
console.log(`\n## Verdict`);
console.log(b.bracketed && b.separable && b.monotonic
  ? `  PASS — a verified boundary: below ~${r(b.boundary)} kg/m3 char density the plaster fails the ${spec}-min rating.`
  : `  NOT a clean boundary (see flags) — re-check.`);
console.log(`  -> If this changed a formulation decision, decision_shift=true => GATE B passed.`);
