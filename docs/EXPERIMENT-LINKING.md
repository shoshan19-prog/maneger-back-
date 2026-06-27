# Experiment Linking — value = Knowledge Δ contribution

> Built after the Knowledge Δ engine (Fresco), and deliberately AFTER it: an experiment is worth
> measuring not by which formula it links to, but by **how much it moved knowledge**.

## The shift
```
Experiment Linking (naive):   Experiment 17  belongs to  Formula 5     ← silent on what changed
Experiment Linking (here):    Experiment 17  moved  Authority Δ / Boundary Δ / Evidence Δ  by X
```
Each experiment carries a **contribution** (evidence added, authority matured, boundaries born).
Applying it to a knowledge state and running the Knowledge Δ engine yields its **learning value**:
```
learning_value = evidence×1 + authority×3 + boundary×5
```
A born boundary outweighs a matured datum outweighs an added evidence item. Identity / composition
do **not** count — they are change, not learning.

## Pre-registration → rank before running (the next-experiment lever)
Declaration precedes measurement: an experiment declares `expected_contribution` BEFORE it runs, so
pending experiments are ranked by **projected** Knowledge Δ. "Which experiment next?" = the one that
would move Authority/Boundary/Evidence the most. Once run, `actual_contribution` replaces the
projection. A pre-registered-but-unrun experiment is **projected only** — never folded into the real
state (`applyCompleted` ignores it).

## On the real registry today
```
COMPLETED — learning history:
  E-011 [intumescent] → value 64 (ev 64 · auth 0 · bound 0)   ← lots of evidence, NO boundary
PRE-REGISTERED — ranked by projected Δ (next experiment):
  ► E-012 → projected value 17 (ev 12 · auth 0 · bound 1)     ← would BIRTH a boundary
```
E-011 produced a great deal of evidence but **no boundary** (confounded, qualitative — n=16). E-012's
worth is precisely the boundary E-011 could not establish. The number is not the point; the *kind* of
Δ is. This is why value is read as `(ev · auth · bound)`, not a single scalar.

## Measurement coverage — the honest dial
A measurement carries authority `source=measurement`, the ONLY path that lifts measurement coverage
above 0%. So Experiment Linking is what will finally move the dial the Knowledge Δ engine reports as
`0%` today — when a real experiment completes with measured results on a represented formula datum.

## Where it lives
- `lib/experimentLink.js` — `applyContribution`, `experimentValue`, `rankByValue`, `applyCompleted`.
  Pure (built on `lib/knowledgeDelta.js`).
- `config/experiment_registry_v1.json` — E-011 (completed) · E-012 (pre-registered).
- `tests/experimentLink.test.mjs` — 5 assertions. CLI: `npm run experiments`.

## The full chain is now closed (in representation)
```
Document → Formula → Knowledge Graph → Experiment → Knowledge Δ → Boundary → Law
```
Every layer exists and is tested. What is still missing is not architecture — it is the first real
measurement that makes `learned=true` on a Fresco formula and lifts measurement coverage off 0%.
That input is human: Rachel / David / a completed E-012.
