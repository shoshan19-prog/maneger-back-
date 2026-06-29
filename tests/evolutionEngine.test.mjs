/**
 * Tests for the Evolution Engine. Run: node tests/evolutionEngine.test.mjs
 * Core checks: the transition is the unit (4 Δ types); based_on resolves across recycled keys;
 * a recurring change is a trend; co-occurring family moves are a strategy; problem→fix is tagged.
 */
import assert from 'node:assert';
import path from 'path';
import { pathToFileURL } from 'url';

const here = path.dirname(new URL(import.meta.url).pathname);
const E = await import(pathToFileURL(path.resolve(here, '../lib/evolutionEngine.js')).href);

let passed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log('✓', name); } catch (e) { console.error('✗', name, '\n  ', e.message); process.exitCode = 1; } };

const V = [
  { id: '01.01.2023-001', key: '001', date: '01.01.2023', based_on: '', composition: { water: 19, 'EXOLIT AP435': 27.4, 'MELAFINE': 10.6, 'ENCOR 367': 21 }, process: ['5 min 300 rpm'], notes: [] },
  { id: '08.01.2023-002', key: '002', date: '08.01.2023', based_on: '001', composition: { water: 18, 'EXOLIT AP435': 27.4, 'MELAFINE': 9.0, 'ENCOR 367': 22, 'CF10': 2 }, process: ['5 min 1500 rpm'], notes: ['על בסיס 001 - הקטנת מלמין, הוספת CF10'] },
  { id: '15.01.2023-003', key: '003', date: '15.01.2023', based_on: '002', composition: { water: 17, 'EXOLIT AP435': 27.4, 'MELAFINE': 8.5, 'VINNAPAS EZ3112': 23, 'CF10': 4 }, process: ['HIGH SHEAR'], notes: ['על בסיס 002 - הוספת CF10 שוב, מאוד מוקצף הוספנו אגיטן'] },
  // a 2025 record that RECYCLES key 001 — must not be mistaken for the 2023 parent
  { id: '03.02.2025-001', key: '001', date: '03.02.2025', based_on: '003', composition: { water: 13, 'EXOLIT AP435': 24, 'MELAFINE': 9, 'VINNAPAS EZ3019': 24, 'CF10': 4 }, process: ['HIGH SHEAR'], notes: ['על בסיס 003'] },
];

t('transition extracts the four Δ types', () => {
  const tr = E.transition(V[0], V[1]);
  assert.ok(tr.composition.added.some(a => a.material === 'CF10'));
  assert.ok(tr.composition.changed.some(c => c.material === 'MELAFINE' && c.delta < 0));
  assert.equal(tr.process.changed, true);
  assert.ok(tr.reasoning.notes.length >= 1);                 // verbatim rationale kept
  assert.equal(tr.decision.status, 'based_on');
});

t('based_on resolves to the chronologically-correct parent (recycled key safe)', () => {
  const parent = E.resolveParent(V[3], V);                   // 2025-001 based_on '003'
  assert.equal(parent.id, '15.01.2023-003');
  const p2 = E.resolveParent(V[1], V);                       // 2023-002 based_on '001' → the 2023 one, NOT 2025
  assert.equal(p2.id, '01.01.2023-001');
});

t('buildTransitions yields one transition per child with a parent', () => {
  const trs = E.buildTransitions(V);
  assert.equal(trs.length, 3);                               // 001 is a root; 002,003,2025-001 have parents
});

t('recurringChanges: the fiber family keeps growing across transitions → a trend', () => {
  const trs = E.buildTransitions(V);
  const rec = E.recurringChanges(trs, { min: 2 });
  // CF10 added in 002 then increased in 003 → +fiber recurs (a trend, not a one-off edit)
  assert.ok(rec.family.some(r => r.token === '+fiber' && r.count >= 2));
});

t('coOccurringMoves: family moves that travel together → a strategy', () => {
  const trs = E.buildTransitions(V);
  const co = E.coOccurringMoves(trs, { min: 1 });
  assert.ok(co.length >= 1);
  assert.ok(co[0].combo.includes('&'));
});

t('problemFixes tags a foam event with its accompanying moves + quote', () => {
  const trs = E.buildTransitions(V);
  const pf = E.problemFixes(trs);
  assert.equal(pf.byProblem.foam, 1);
  assert.ok(pf.events[0].quote.includes('מוקצף'));
});

t('boilerplate notes are filtered from reasoning (only rationale kept)', () => {
  const child = { ...V[1], notes: ['3 דקות', 'וודא שאין קצף לפני המעבר', 'על בסיס 001 - הקטנת מלמין'] };
  const tr = E.transition(V[0], child);
  assert.equal(tr.reasoning.notes.length, 1);
  assert.ok(tr.reasoning.notes[0].includes('הקטנת מלמין'));
});

console.log(`\n${passed} passed`);
