# MATRIYA Boundary Intelligence — status, % complete, and immediate queue

> Honest completion estimate toward a **working Boundary Intelligence system at GATE B**
> (one verified boundary that changed a decision). Updated after integrating the Drive
> seeds + reconciling with the live schema.

## 1. Overall completion: ~38%

The conceptual architecture and the buildable scaffolding are well advanced; the empirical
core, deployment, and the closed loop are barely started. Of the work that can be done
**without Rachel**, ~70% is done (≈30% remains).

| Area | % done | Note |
|---|---|---|
| **Authority — Material identity** | 85% | resolver+seed+tests; needs live-DB wiring + dedup decision |
| **Authority — Axis (property registry)** | 80% | canonical registry → axes (migration 010); needs DB run + noise_floor |
| **Authority — Equipment** | 80% | equipment registry → table (011); needs DB run |
| **Evidence — Observation contract** | 70% | built+tested+endpoint; **blocked by reconciliation** w/ live measurements/outcomes |
| **Engine — boundary derivation** | 75% | deriveBoundary tested; needs real outcome_class + MME |
| **Engine — contradiction detection** | 70% | tested; runs on real data when outcome/MME exist |
| **Registry — couplings (E-010)** | 60% | 15 trade-off boundaries seeded; 0/15 verified |
| **Registry — mechanism hypotheses** | 50% | seeded; all status=HYPOTHESIS |
| **Design gate — formulation rules** | 80% | tested + endpoint |
| **Data pipeline — ingest/CSV/backfill** | 80% | works; historical = not boundary-grade |
| **Navigation / coverage map** | 25% | measurementCoverage lib only; no map/UI |
| **Closed loop — next-experiment proposer** | 10% | to_verify + couplings exist as data; no engine |
| **Reference corpus mining (TDS/SDS/competitor)** | 5% | corpus uploaded; not yet extracted |
| **Deployment / live-schema reconciliation** | 5% | nothing run on DB; observations↔measurements unresolved |
| **Empirical (T_noise/MME, specs, experiment)** | 5% | Rachel/lab — almost nothing |

## 2. What can be done WITHOUT Rachel (the map)

**Buildable now (code/data, testable, safe):**
1. **Mine the Drive corpus** — extract material properties from TDS/SDS into the materials
   registry; extract competitor performance (FlameOFF, Cafco, PPG Steelguard, Lapinus) into
   a **competitor-benchmark registry** (real external boundary evidence). *(big, high value)*
2. **Next-experiment proposer** — rank `mechanism_hypotheses.to_verify` + unverified
   `couplings` by value; output "the experiment to run next". (active-learning seed)
3. **Navigation/coverage endpoint** — per (material×axis) how many observations + which are
   measurable (joins coverage lib); the coverage-map skeleton.
4. **Backfill enrichment** — join burn-test ↔ composition sheets so backfilled observations
   carry APP_LOADING + material amounts.
5. **Test runner + `npm test`** + minimal CI.
6. **D1 decision doc** — matriya-back vs matriya-system canonical codebase.
7. **Prepare BOTH reconciliation options** (extend measurements/outcomes vs supersede) as
   ready-to-run migrations, so the human decision is a one-click pick.

**NOT doable without Rachel/human (hard stops):**
- T_noise/MME per axis · T_relevance/outcome specs (Works/Fails) · the actual experiment.
- Running migrations on the production DB.
- The observations↔measurements/outcomes decision (needs David/lab sign-off).
- Dedup of ambiguous material names.

## 3. Immediate task sequence (this work block, autonomous)
In priority order — each is committable and testable without Rachel:

1. **Competitor-benchmark registry** from the corpus datasheets → real external boundary
   evidence (e.g. FlameOFF/Cafco expansion, DFT, fire rating). `config/` + migration + lib.
2. **Next-experiment proposer** (`lib/nextExperiment.js` + test + endpoint) — turns
   to_verify/couplings into a ranked experiment queue. This is the closed-loop seed.
3. **Coverage/navigation endpoint** (`GET /api/coverage`) — read-only map skeleton.
4. **Backfill enrichment** (APP + composition join).
5. **Test runner** (`npm test`) + CI stub.
6. **Reconciliation options prepared** (two migration drafts) for the human decision.

## 4. The critical path to GATE B (where Rachel re-enters)
```
[done] authority + engine + registries built
   |
[human] decide observations vs measurements/outcomes  -> run migrations 007-013
   |
[Rachel] T_noise (MME) + outcome specs + run E-011 / PRR Trial
   |
[auto]  ingest -> deriveBoundary -> first VERIFIED boundary -> decision_shift = true
   |
GATE B  (one boundary that changed a decision)  -> build the full engine (Phase C)
```

**Bottom line:** ~38% overall; ~70% of the no-Rachel work done. The next block (items 1–6
above) can push the no-Rachel portion toward ~90% — after that, progress is gated on the
human reconciliation decision and Rachel's empirical numbers.
