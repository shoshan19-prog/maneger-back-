# Knowledge Graph (derived) — the layer above Formula Schema v1.1

> Built after the schema was locked (Fresco). It is **derived, not stored** (Law 3: store
> observations, derive boundaries) — `graph(t)` is recomputed from the canonical Formula Objects,
> so there is no parallel persisted truth to drift. No DB / migration: `lib/knowledgeGraph.js` is
> pure; persistence is a later, human-gated decision.

## Not "contains", but the chemist's chain
```
Formula → Functional Role → Component → PSD → [Functional Interface → Process → Measurement → Performance]
```
The bracketed tail is **pending** until process / measurement data exists — the nodes/edges are
defined so adding that data needs no restructure.

## Node & edge types
| node | key | from |
|---|---|---|
| Formula | `F:<formula_id>` | canonical formula (id provisional, Q-009) |
| Component | `C:<norm(material)>` | ingredient (identity provisional, Phase A5) |
| FunctionalRole | `R:<formula_id>\|<material>\|<role>` | formula-scoped role |
| PSDFraction | `P:<fraction>` | psd[] |

| edge | from → to | authority |
|---|---|---|
| `contains` | Formula → Component | objective / document |
| `has_role` | Formula → FunctionalRole | from the role (interpreted/heuristic; psd objective) |
| `assigns` | FunctionalRole → Component | same as the role |
| `uses_psd` | Formula → PSDFraction | objective / document |

**Every edge carries the two-dimensional authority `{ field, source }`.** So `subgraph(g,
{source:'measurement'})` returns only measurement-backed knowledge — the query Fresco asked for,
with no change to the structure.

## Questions it answers (all on real data today)
- `formulasSharingPsd` — which formulas share a PSD fraction. *(real: `0.8-1.4` in 4/8 formulas,
  `0-0.8` in 3/8.)*
- `coOccurringIngredients` — which ingredients always appear together.
- `rolesOfMaterial(material)` / `materialsWithMultipleRoles` — the CaCO3 insight made queryable: a
  material's role is formula-scoped, so the graph can show the same material in different roles.
- `authorityCoverage` — how much of the knowledge is measurement-backed vs heuristic. *(real today:
  54% document · 46% heuristic · **0% measurement** — honest; rises only when experiment/QC enters.)*
- `diffFormulas(a, b)` — what changed between two versions (added/removed ingredients, percent
  shifts, role shifts) — "what changed between V4 and V5".

## Boundaries held
- **Derived, not stored** — no persisted graph, no migration.
- **Identity provisional** — formula_id (Q-009) and Component identity (Phase A5) are not yet
  canonical; the graph marks them provisional and must not be aggregated as if canonical.
- **No fact from heuristic** — authority travels onto every edge unchanged; a measurement subgraph
  is genuinely empty today (0%), not faked.
- **Pending tail is empty, not guessed** — Functional Interface → Process → Measurement →
  Performance carry no invented edges.

## Where it lives
- `lib/knowledgeGraph.js` — `buildGraph`, `formulasSharingPsd`, `coOccurringIngredients`,
  `rolesOfMaterial`, `materialsWithMultipleRoles`, `authorityCoverage`, `subgraph`, `diffFormulas`.
- `tests/knowledgeGraph.test.mjs`. CLI: `npm run graph` (aggregates only — no composition leaks).

## Next (human-gated)
1. Q-009 → canonical formula_id; Phase A5 → canonical Component identity. Then aggregation across
   the graph becomes authoritative.
2. Process / measurement / performance ingestion → fills the pending tail and lifts
   measurement-backed coverage above 0%.
3. Persistence (only if a human decides): map this derived graph onto the live DB — never a parallel
   stored truth.
