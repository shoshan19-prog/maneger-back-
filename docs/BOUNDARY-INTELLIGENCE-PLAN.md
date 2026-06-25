# MATRIYA Boundary Intelligence — Project Plan v1.0

> Detailed execution plan: goals, measurable objectives, tasks, timelines, gates.
> Start reference: W1 = first week after approval. Assumes ~1 developer + lab
> participation (lab head for empirical numbers and experiments).
> Status of each task: ☐ todo · ◐ in progress · ☑ done.

---

## 1. Strategic goal

Turn MATRIYA from a knowledge/answer system into a **Boundary Intelligence
Platform**: a system whose asset is an empirical map of *where materials,
formulations and processes break* — knowledge that cannot be reproduced by
documents, RAG or LLMs alone.

We do **not** discard the existing strength (best-in-class evidence/grounding
gates). We re-point it onto a correct identity + observation foundation.

## 2. Operating principles (the laws — fixed)

1. Authority Before Intelligence — identity/evidence before reasoning.
2. Identity Before Aggregation — no aggregation over a non-canonical key.
3. Store observations, derive boundaries (LAW-BOUNDARY-001).
4. Capture wide, infer narrow — record all context; condition on the critical subset.
5. A boundary is valid only within its established context.
6. Calibrate before discovering; pre-register before measuring.

## 3. Success definition & KPIs

**North-Star KPI:** *Operationally-weighted boundary coverage* —
`% of relevant (material × axis) cells that have ≥1 verified boundary`.
(Relevant = cells near where Fresco actually formulates/decides.)

| KPI | Definition | Target by end of plan |
|---|---|---|
| Verified Observations | observations passing the contract gate | ≥ 300 |
| Verified Boundaries | boundaries derived + passing calibration | ≥ 5 |
| Decision-Changing Boundaries | boundaries that changed a real R&D decision | ≥ 1 (Phase B), ≥ 3 (end) |
| Boundary Information Gain | uncertainty-interval contraction per experiment | tracked from Phase C |
| Data integrity | % writes routed through the contract gate | 100% on new data |

---

## 4. Phases

### PHASE A — Foundation (data becomes boundary-grade) · W1–W5

**Objective:** every new measurement enters as a canonical, validated observation,
and material identity is single-source. This is the irreversible work.

**Tasks**
- ☐ A1. Run migration 007 on management DB (axes + observations + append-only trigger). *(0.5d, Dev)*
- ☐ A2. Build `POST /observations` endpoint routing every write through `lib/observationContract.js`; reject on contract violation; return warnings. *(3–4d, Dev)*
- ☐ A3. Minimal entry UI: form/CSV import for observations (axis, value, unit, method, conditions, provenance, outcome). *(3–4d, Dev)*
- ☐ A4. Seed real axes with lab values: units, methods, `noise_floor` (MME), `outcome_spec` for CHAR_DENSITY, CHAR_HEIGHT, FILM_THICKNESS, TIME_TO_FAILURE, APP_LOADING. *(Lab + Dev, 2d)*
- ☐ A5. **Close identity fracture:** make `materials` canonical the single source; add FK `experiment_materials.material_id → materials.material_id`; alias resolver (MEL/Melamine/Melafine → one id); migrate ~9 `material_library` call sites in `server.js`. *(5–7d, Dev)*
- ☐ A6. Dedup/clean existing material names into canonical `materials`. *(2–5d, Dev — depends on data volume)*
- ☐ A7. Best-effort backfill: parse existing free-text `results` into observations, flagged `confidence=low`, never overwriting raw. *(3–5d, Dev)*

**Deliverables:** live observation pipeline; single material identity; backfilled historical observations.
**Definition of done:** 100% of new writes go through the gate; FK enforced; ≥50 historical observations backfilled; `material_library` no longer a source of truth.
**GATE A (go/no-go):** can we record a clean, validated observation end-to-end? If no → fix before Phase B.

---

### PHASE B — First real boundary (prove value) · W4–W9 (overlaps A)

**Objective:** derive one validated boundary and show it changes a decision.

**Tasks**
- ☐ B1. Lab finalizes E-011 2.0 pre-registration numbers (method, MME, Works/Borderline/Fails spec). *(Lab, 1–2d)*
- ☐ B2. Run the controlled experiment — scan toward CHAR_DENSITY, baseline locked (CE-003), ≥3 levels straddling the suspected boundary, ≥3 replicates. *(Lab, ~2–4 weeks incl. aging)*
- ☐ B3. Ingest all runs as observations (via Phase-A pipeline). *(Dev, 1d)*
- ☐ B4. Boundary derivation query: classify Works/Borderline/Fails, locate crossing, compute σ(boundary) = MME/|slope|. *(Dev, 4–5d)*
- ☐ B5. Calibration check vs lab ground truth per pre-registration success criterion. *(Dev + Lab, 1d)*
- ☐ B6. Demonstrate the boundary informed a real formulation decision; record it. *(Lab, 1d)*

**Deliverables:** 1 verified boundary with full provenance + interval; 1 decision-changing boundary.
**Definition of done:** calibration PASS (or documented falsification + diagnosis); KPI "Decision-Changing Boundaries" ≥ 1.
**GATE B (go/no-go):** did the method recover a known boundary AND change a decision? If no → stop; revert to knowledge-system model. If yes → build the engine.

---

### PHASE C — The engine (become competitive) · W9–W21 (~3 months)

**Objective:** scale from one boundary to a self-directing boundary map.

**Tasks**
- ☐ C1. Boundary inference engine: derive boundaries on demand across all observations; persist nothing (derive at query). *(2–3w, Dev)*
- ☐ C2. Contradiction detection: surface conflicting observations on the same canonical axis (e.g. works@60% vs fails@55%). *(1–2w, Dev)*
- ☐ C3. **Closed loop — next-experiment proposer:** Bayesian optimization / active learning over the boundary map; rank experiments by information gain × impact. Re-point `researchLoop` + `doe_designs`. *(3–4w, Dev)*
- ☐ C4. Navigation UI: coverage map (dense / sparse / contradictory regions; "where am I / where can I go"). *(2–3w, Dev)*
- ☐ C5. Operationally-weighted coverage KPI dashboard. *(1w, Dev)*

**Deliverables:** on-demand boundaries; contradiction alerts; ranked next-experiment suggestions; coverage map.
**Definition of done:** system proposes the next experiment and quantifies expected information gain; coverage KPI live.

---

### PHASE D — Hygiene & consolidation (parallel, ongoing)

- ☐ D1. Decide `matriya-back` (monolith) vs `matriya-system` (modular) as the canonical codebase; stop duplication. *(decision W2; migration ongoing)*
- ☐ D2. Break up `maneger-back/server.js` (5,610 lines) into modules. *(incremental)*
- ☐ D3. Test coverage: extend the determinism/isolation/threshold pattern to identity, contract, boundary derivation. *(ongoing)*
- ☐ D4. Equipment identity (folds into Axis Authority as measurement method). *(when a 2nd instrument matters)*

---

## 5. Timeline (relative weeks)

```
W: 1   2   3   4   5   6   7   8   9  ...  21
A  ███████████████                              Foundation
B           ██████████████████                  First boundary (lab-paced)
C                       ████████████████████████ Engine (~3 mo)
D  ·············································· Hygiene (parallel)
   ▲GATE A (W5)      ▲GATE B (W9)        ▲Competitive (W21)
```

Critical path: A5 (identity fix) → A2 (pipeline) → B2 (lab experiment, longest single
item due to aging) → B4 → GATE B → C.

## 6. Roles

| Role | Owns |
|---|---|
| **Developer** | A1–A3,A5–A7, B3–B4, C1–C5, D1–D3 |
| **Lab head (you)** | A4, B1, B2, B5–B6 — all empirical numbers, methods, specs, experiments. Personal Veto on every new axis. |
| **System** | enforces the contract; derives boundaries; proposes next experiments |

## 7. Risks & mitigations (carried from analysis)

| Risk | Mitigation |
|---|---|
| Ontology inflation (too many axes) | ≤5–7 axes year 1; new axis needs lab veto + decision-impact proof |
| Mechanism neglect → brittle boundaries | mechanism is optional conjecture (Reasoning), predicts transferability; never a required boundary field |
| Context explosion → no repeatability | capture wide, condition narrow |
| Survivorship bias | a boundary requires Works **and** Fails bracketing; reward logging failures |
| Premature formalization | Phase B gate before building Phase C engine |
| Data-volume unknown (A6) | scoped best-effort; new data is clean regardless |

## 8. Decision gates (summary)

- **GATE A (W5):** clean validated observation end-to-end → proceed.
- **GATE B (W9):** boundary recovered + decision changed → build engine; else stop.
- **Value gate (continuous):** no expensive build proceeds on an unproven value hypothesis.
