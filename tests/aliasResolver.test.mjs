/** Tests for the material identity resolver. Run: node tests/aliasResolver.test.mjs */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const { buildResolver, resolveMaterial } = await import(pathToFileURL(path.resolve(here, '../lib/aliasResolver.js')).href);

let passed = 0;
const t = (n, fn) => { try { fn(); passed++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n  ', e.message); process.exitCode = 1; } };

t('the MEL/Melamine/Melafine trio collapses to one id', () => {
  assert.equal(resolveMaterial('MEL').material_id, 'MELAMINE');
  assert.equal(resolveMaterial('Melafine').material_id, 'MELAMINE');
  assert.equal(resolveMaterial('MELAFINE').material_id, 'MELAMINE');
  assert.equal(resolveMaterial('melamine').material_id, 'MELAMINE');
});

t('APP and its EXOLIT trade names collapse to APP', () => {
  assert.equal(resolveMaterial('EXOLIT AP435').material_id, 'APP');
  assert.equal(resolveMaterial('exolit ap423').material_id, 'APP');
  assert.equal(resolveMaterial('ammonium polyphosphate').material_id, 'APP');
});

t('normalization ignores case/spaces/punctuation', () => {
  assert.equal(resolveMaterial('CHARMOR PM 40').material_id, 'PER');
  assert.equal(resolveMaterial('charmor pm40').material_id, 'PER');
  assert.equal(resolveMaterial('Charmor-PM-40').material_id, 'PER');
});

t('unknown material resolves to null', () => {
  assert.equal(resolveMaterial('unobtanium'), null);
});

t('matched_on reports how it matched', () => {
  assert.equal(resolveMaterial('APP').matched_on, 'id');
  assert.equal(resolveMaterial('MELAFINE').matched_on, 'alias');
});

t('resolver works against an arbitrary materials list (live-data shape)', () => {
  const r = buildResolver([{ material_id: 'X', material_name: 'Thing', aliases: ['widget'] }]);
  assert.equal(r.resolve('widget').material_id, 'X');
  assert.equal(r.resolve('MEL'), null); // not in this list
});

console.log(`\n${passed} passed`);
