#!/usr/bin/env node
// Measurable progress: counts the boundary-intelligence artifacts that exist.
import { readdirSync, existsSync } from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const count = (d, re) => existsSync(path.join(root, d)) ? readdirSync(path.join(root, d)).filter(f => re.test(f)).length : 0;
const items = {
  'libs (lib/*.js boundary)': count('lib', /^(observationContract|boundaryAxes|boundaryDerive|contradictionDetect|formulationRules|measurementCoverage|aliasResolver|materialsSeed|nextExperiment)\.js$/),
  'tests (tests/*.test.mjs)': count('tests', /\.test\.mjs$/),
  'migrations (007-013)': count('migrations', /^0(0[7-9]|1[0-3])_/),
  'config registries': count('config', /\.json$/),
  'docs (boundary)': count('docs', /BOUNDARY|E-011|RACHEL|DRIVE|SCHEMA|STATUS|DAVID/),
};
console.log('Boundary Intelligence — artifact inventory');
for (const [k, v] of Object.entries(items)) console.log(`  ${String(v).padStart(3)}  ${k}`);
