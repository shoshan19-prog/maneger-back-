# Replication Layer — the link between Knowledge Δ and Law

> The subtle, decisive distinction (Fresco): a law is NOT born from a Knowledge Δ. It is born when a
> Knowledge Δ **survives independent replication**. Everything before this layer represents a *model
> of learning*; this layer is what separates a model of learning from *validated* learning.

## The missing link in the chain
```
... → Knowledge Δ → Replication → Boundary → Law
```
A Boundary Δ from a single experiment is a **candidate boundary**, not knowledge. It must be
re-observed independently, under defined conditions, to earn its way up.

## Three states (a ladder)
| state | earned by |
|---|---|
| **candidate** | born from a single experiment |
| **supported** | re-observed independently at least once (held) |
| **established** | held across ≥2 distinct DEFINED conditions, no in-context violation → a law is justified |
| *contested* | violated within its declared context — the boundary, as stated, failed |

A re-run of the *same* experiment is not replication (must be `independent`). The set of conditions
under which a boundary held IS its validity scope (Law 5: valid only in context).

## Two metrics, orthogonal — value ≠ confidence
`learning_value` (Experiment Linking) measures how much an experiment MOVED knowledge.
`confidence` (here) measures how STABLE that knowledge is — and depends ONLY on replication
(independent holds, condition diversity, in-context violations), never on learning_value.
```
learning_value = 64   confidence = 0.22     ← a lot of evidence, one experiment, unstable (E-011)
learning_value = 18   confidence = 0.94     ← less evidence, replicated across conditions, reliable
```
They are not the same axis. A successful one-off formulation change is a *finding*; only when it
repeats, holds across batches, and stays valid under defined conditions does it become *knowledge*.

## Why this matters for Fresco
Not every successful formulation change should become organizational knowledge. Only one that
**repeats**, **survives across batches**, and **stays valid under defined conditions** crosses from
"finding" to "knowledge". This layer encodes exactly that gate.

## On the real registry today
```
B-DENSITY-TTF  [candidate]  confidence=0.20  replications=0
Established boundaries: 0  ·  any law justified: false
```
The density→TTF boundary (WP-002 / E-012) is a candidate-in-waiting — E-012 is not even run yet.
Nothing is established; no law is justified. Honest.

## Where it lives
- `lib/replication.js` — `boundaryState`, `confidence`, `addReplication`, `lawJustified`, `summarize`.
  Pure.
- `config/boundary_registry_v1.json` — B-DENSITY-TTF (candidate).
- `tests/replication.test.mjs` — 7 assertions. CLI: `npm run boundaries`.

## What this does NOT do (still pending — awaits data)
- **Boundary Validation** — needs real measurements (E-012) to move a boundary off candidate.
- **Law Registry** — needs independent replication across domains to promote LAW-AUTHORITY-001 from
  candidate to a general law. The replication layer is the instrument that will measure that; the
  promotion itself awaits the data.
