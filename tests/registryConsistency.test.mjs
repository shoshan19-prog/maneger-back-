/**
 * Registry consistency — fails if an axis drifts across the four maps (Fresco: stabilize the
 * ground before Ground Truth). A missing cross-link would make a confusion matrix measure an
 * infrastructure error, not a parser error. Run: node tests/registryConsistency.test.mjs
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const imp = (p) => import(pathToFileURL(path.resolve(here, '../lib/' + p)).href);
const { PARAMETERS, NUMERIC } = await imp('parameterDictionary.js');
const { ONTOLOGY } = await imp('measurementOntology.js');
const { CAPABILITY } = await imp('documentCapability.js');
const { EXPECTED } = await imp('specExtract.js');
const { normalize } = await imp('unitNormalize.js');

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const dictAxes = new Set(PARAMETERS.map(p => p.axis));
const ontoAxes = new Set(Object.keys(ONTOLOGY));
// non-axis info tokens that legitimately appear in capability maps
const INFO_TOKENS = new Set(['ingredients', 'results', 'procedure']);

t('every Parameter Dictionary axis has a Measurement Ontology classification', () => {
  for (const ax of dictAxes) assert.ok(ontoAxes.has(ax), `ontology missing axis: ${ax}`);
});

t('every Ontology axis exists in the Parameter Dictionary', () => {
  for (const ax of ontoAxes) assert.ok(dictAxes.has(ax), `dictionary missing axis: ${ax}`);
});

t('every real axis in the Capability Map is a known axis (info tokens excluded)', () => {
  for (const [dt, c] of Object.entries(CAPABILITY)) {
    for (const ax of [...(c.can_contain || []), ...(c.should_not_contain || [])]) {
      if (INFO_TOKENS.has(ax)) continue;
      assert.ok(dictAxes.has(ax), `capability "${dt}" references unknown axis: ${ax}`);
    }
  }
});

t('every EXPECTED axis exists in dictionary + ontology and is referenced by some doc type', () => {
  const capAxes = new Set(Object.values(CAPABILITY).flatMap(c => [...(c.can_contain || []), ...(c.should_not_contain || [])]));
  for (const fam of Object.values(EXPECTED)) {
    for (const ax of [...(fam.numeric || []), ...(fam.external || [])]) {
      assert.ok(dictAxes.has(ax), `EXPECTED axis not in dictionary: ${ax}`);
      assert.ok(ontoAxes.has(ax), `EXPECTED axis not in ontology: ${ax}`);
      assert.ok(capAxes.has(ax), `EXPECTED axis not placed in any document capability: ${ax}`);
    }
  }
});

t('every numeric parameter unit is normalizable (no silent normalization failure)', () => {
  for (const p of NUMERIC) {
    const n = normalize(1, p.source_unit);
    assert.ok(n.normalized, `unit not normalizable for ${p.axis}: "${p.source_unit}"`);
  }
});

console.log(`\n${passed} passed`);
