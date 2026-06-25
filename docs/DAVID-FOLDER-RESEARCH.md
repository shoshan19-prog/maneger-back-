# David's Drive folder — deep research + remaining task backlog

## What David's folder is
`…/1REBO6ziEK3gwXd5X3kZ8fsgnAEvzA-sm` is the **D-MATRYA research-paper project**, not an
operational lab store. Deep scan:

| Item | What it is | Useful for boundaries? |
|---|---|---|
| `intumescent_domain_pack.yaml` | Materials+aliases, axes+units, threshold rules, failure modes | 🎯 **Yes — already integrated** (migration 008, materialsSeed, known-boundaries, formulationRules) |
| `D-Matrya Kernel` | The FSCTM (K→C→B→N→L) methodology, Possibility-Space Shutdown, ETFL | Already implemented in matriya-back (kernelV16/researchGate) — methodology, not data |
| `02_Benchmarks` (+ docs) | Academic comparison tables (R²/MAE/F1 vs humans/ML) for the paper | No — illustrative paper material, not Fresco empirics |
| `02_Datasets` / `Datasets_01` (Raw/Clean/Final) | Dataset scaffolding | **Empty** — no data files |
| Paper / Chapters / Benchmark_01..05 / Marketing / Roadmap | Paper writing + GTM | Context only |

## Honest conclusion
The folder yielded **one** operational asset — the domain pack — which we already mined.
**No empirical numbers (MME, measurement methods, Works/Fails thresholds) exist there.**
Those remain genuinely blocked on Rachel. The deep dive confirmed we are not missing a
hidden dataset.

## What this session built from the domain pack (no Rachel, no SharePoint)
- Material identity: `materialsSeed.js`, `aliasResolver.js` (+tests), migration 008.
- Known boundaries: `docs/known-boundaries.seed.json`.
- **Formulation rule-checker**: `lib/formulationRules.js` (+tests), `POST /api/formulation-check`
  — domain-pack composition rules as a live pre-experiment gate.

## Remaining tasks doable WITHOUT Rachel (backlog, prioritized)
1. **Enrich the backfill with APP + composition** — join the burn-test sheet to the
   formulation/composition sheet (by formulation/version) so backfilled observations carry
   `APP_LOADING` and material amounts as conditions. (I have the xlsx.)
2. **Live-data resolver** — build the alias resolver from the `materials` table (not the
   seed) when the DB is reachable; add a `/api/materials/resolve?name=` helper.
3. **Domain-rule check on existing formulations** — run `checkFormulation` across the 48
   formulations in the xlsx; report which violate domain-pack boundaries (design audit).
4. **Boundary index / coverage stub (C5)** — a read endpoint that reports, per
   (material×axis), how many observations exist (coverage map skeleton; fills as data arrives).
5. **Test runner + npm script** — `npm test` to run all `tests/*.test.mjs`; optional CI.
6. **D1 decision doc** — matriya-back (monolith) vs matriya-system (modular): pick the
   canonical codebase, stop duplication.
7. **server.js decomposition (D2)** — extract the boundary endpoints into a router module.

## Hard stops that NEED Rachel (do not attempt without her)
- MME (noise floor) per axis · measurement methods · Works/Borderline/Fails specs ·
  the controlled experiment (density scan) · decisions on ambiguous/unknown material names ·
  running migrations + the FK on the production DB.
