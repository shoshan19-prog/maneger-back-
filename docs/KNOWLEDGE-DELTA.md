# Knowledge Δ Engine — measuring what we LEARNED

> Built before Experiment Linking (Fresco). The Knowledge Graph answers *what exists / shared /
> changed*. It does **not** answer the central R&D question: **"what did we learn?"** That is not a
> question about a graph — it is a question about the EVOLUTION of knowledge. This engine measures it.

## Not another entity — a layer that measures change
`Formula V4 → Formula V5` is not just `+APP / −CaCO3 / PSD changed`. The meaningful reading is by the
TYPE of knowledge that moved. So every change is classified into five Δ types:

| Δ type | meaning | example |
|---|---|---|
| **1. Identity Δ** | a new identity appeared | new formula / new material (APP) |
| **2. Composition Δ** | ingredient added / removed / re-proportioned | −CaCO3, +APP, 0-0.8 50%→55% |
| **3. Authority Δ** | a datum **matured** (the most important) | `pending → interpreted → objective(document) → objective(measurement)` |
| **4. Boundary Δ** | a new boundary was born | "PSD 0.8-1.4 works only below APP 24%" |
| **5. Evidence Δ** | how many evidence items added | +3 pull-off, +2 viscosity, +4 compression |

**Authority Δ is the deepest:** knowledge can become more authoritative *without changing what it is
about*. A role that was a heuristic guess becoming a measured fact is learning, even if not a single
ingredient changed. The maturity ladder is a single ordinal so a maturation is a +1 step:
```
pending(0) < interpreted(1) < objective/document(2) < objective/measurement(3) < objective/instrument(4)
```

## Representation ≠ Learning (operationalized)
`summary.learned` is **true only if** Authority Δ, Boundary Δ, or Evidence Δ moved — NOT for a pure
composition edit. Changing ingredients is a *change*; only maturation / a new boundary / new evidence
is *learning*. Current corpus (empty → today):
```
Identity Δ 42 · Composition 0 · Authority 0 · Boundary 0 · Evidence 0
Measurement coverage 0% → 0% · learned = false
```
We have **built** a knowledge state but not yet **learned**. That is the honest gap, stated formally.

## Why this beats Experiment Linking (and reorders it)
Experiment Linking says *"Experiment 17 belongs to Formula 5"* — useful, but silent on *what changed
because of it*. Knowledge Δ gives every experiment a **value metric**: how much it moved Authority Δ /
Boundary Δ / Evidence Δ. So the build order is:
```
1. Formula Schema          ✅
2. Derived Knowledge Graph ✅
3. Knowledge Δ Engine      ✅ (this)
4. Experiment Linking      next — each experiment measured by its Δ contribution, not just its link
```
The full chain MATRIYA is becoming:
```
Document → Formula → Knowledge Graph → Experiment → Knowledge Δ → Boundary → Law
```
This matches the methodology: a law is born after the KNOWLEDGE STATE changes (K→C→B→N→L), not merely
because an experiment ran.

## Where it lives
- `lib/knowledgeDelta.js` — `buildState`, `computeDelta`, `authorityMaturity`, `measurementCoverage`.
  Pure.
- `tests/knowledgeDelta.test.mjs` — 8 assertions. CLI: `npm run delta`.

## Boundaries held
- **Derived** — Δ is computed between two states, nothing stored.
- **Honest measurement coverage** — 0% until real measurement/instrument evidence enters; never faked.
- **learned ≠ changed** — edits do not count as learning; maturation / boundary / evidence do.
