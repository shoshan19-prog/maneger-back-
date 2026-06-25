# MATRIYA — Master Architecture v1.0

> **Stable reference** (changes slowly). Progress/session notes live separately
> (`docs/SESSION-SUMMARY.md`, `docs/STATUS-AND-ROADMAP.md`) and reference THIS document;
> they describe only what changed. This file describes the system as designed.
> Status of each component is governed by `config/architecture_authority_map.json`.

---

## Reality Map (one-minute state)
| Layer | State |
|---|---|
| UI (matriya-front, maneger-front) | **Connected** |
| Backend (matriya-back, maneger-back) | **Connected** |
| Database (live Supabase, 64 tables) | **Connected** |
| Identity (materials, axes, equipment) | **Partial** — canonical built on branch, not deployed |
| Evidence (Observation Contract) | **Partial** — built; reconciliation with measurements/outcomes pending |
| Laboratory (per-project tests) | **Partial** — tests run; MME/specs missing |
| Boundary Engine | **Prototype** — derive/contradiction/couplings tested, no real data yet |
| Decision Engine | **Not validated** — no verified boundary has changed a decision (GATE B) |

---

## 1. Vision
MATRIYA is a **Boundary Intelligence Platform**. Its asset is an empirical map of *where*
materials, formulations and processes **break** — not a store of "what is known". Value =
the volume of the possibility space that has been **reliably ruled out**, in context.
Governing law: **Authority Before Intelligence** — a system cannot reason beyond the quality
of its identity and evidence layers.

## 2. System Layers
1. **Axis Authority (Layer 0)** — canonical measurement coordinates ({dimension, unit, method}).
2. **Identity Authority (Layer 1)** — canonical Projects, Materials, Experiments, Equipment, Documents.
3. **Evidence (Layer 2)** — observations: append-only empirical points bound to identity.
4. **Boundary Inference (Layer 3)** — boundaries derived from observations (never stored).
5. **Navigation (Layer 4)** — coverage map: where the map is dense / sparse / contradictory.
6. **Reasoning (Layer 5)** — proposes the next experiment (information gain); LLMs sit on top.
Equipment is **not** a separate peer layer — it is the "how measured" parameter of an axis.

## 3. Canonical Data Model
- **axes** — Axis Authority (id, unit, method, direction_of_good, evidence_tier, codebook, noise_floor). Source: `config/property_registry_canonical_v1.json`.
- **materials** — canonical identity (+ aliases); resolver collapses trade names (EXOLIT→APP, MELAFINE→MELAMINE). `material_library` demoted to per-project view.
- **observations** — canonical long format `(axis_id, value, unit, method, conditions, provenance, uncertainty, outcome_class)`. **Must LAYER onto live `measurements`(event)+`outcomes`(results)**, not fork (see `docs/SCHEMA-RECONCILIATION-DECISION.md`).
- **equipment** — instruments → property codes measured + standards. Source: `config/lab_equipment_seed_v1.json`.
- **property_couplings** — property-vs-property trade-off/synergy boundaries (15, E-010), each with a falsifier.
- **mechanism_hypotheses** — K-stage levers + `to_verify` per property.
- Live (production, keep): `experiments` (has `decision_shift`, `breakdown_flag`, `conditions`), `formulations`, `formulation_materials`, `measurements`, `outcomes`.
- **LAW-BOUNDARY-001:** boundaries are never stored; only observations are. Boundaries emerge from aggregation over canonical axes.

## 4. Evidence Flow
`measurement (lab) → CSV (contract template) → import_observations → observation-lint (the gate)
→ POST /api/observations → observations table → deriveBoundary / contradictions`.
Every write passes the single contract gate (`lib/observationContract.js`). Reasoning order is
the FSCTM kernel: **K→C→B→N→L** (knowledge → contradiction → breakdown → new → law), enforced
by `researchGate` with hard-stop on integrity violations.

## 5. Laboratory Integration
- **Equipment Authority** maps each axis to the instrument + standard that measures it; reports
  what is **not** measurable (no rig).
- **Per-project test registry** (`config/project_test_registry_v1.json`, from Rachel) = what each
  project actually measures. `GET /api/coverage?project=` = the **work gap** (measurable but not measured).
- **Calibration = PRR Trial:** T_noise (MME) = full-pipe variance under a locked protocol (6 repeats);
  declared `minimal_meaningful_effect` (T_relevance) signed **before** measuring.

## 6. Boundary Engine
`deriveBoundary(points, mme)`: locates the Works→Fails crossing on an input axis, brackets it,
derives direction, and translates response-noise to boundary-location uncertainty:
`σ(boundary) = MME / |d(response)/d(input)|`. Requires a Works **and** a Fails point (bracketing).
Companion: contradiction detection (same axis+context disagreement), formulation rule-checker
(domain-pack thresholds), competitor benchmarks (external evidence).

## 7. Decision Engine
- **Decision Boundary = max(T_noise, T_relevance)** → Knowledge State
  (SUPPORTED / REFUTED / INCONCLUSIVE / NOT_ISOLATABLE / NOT_TESTABLE).
- A boundary is valid only within its **Protocol Context**.
- KPI of value = **decision-changing boundaries** (`experiments.decision_shift`), not boundary count.

## 8. Governance
- `config/architecture_authority_map.json` — single source for component ownership/status/decision.
- The laws: Authority Before Intelligence · Identity Before Aggregation · Store observations,
  derive boundaries · Capture wide, infer narrow · Valid only in context · Declaration precedes measurement.
- Evidence tiers: PROVEN_HERE_ELIGIBLE → OBSERVED → INFERRED → HYPOTHESIS.
- Vocabulary (canonical): T_noise (=MME), T_relevance (=spec), PRR, Claim, Knowledge State.

## 9. Deployment State
- Two codebases: `matriya-back` (RAG/kernel monolith) + `maneger-back` (mgmt/lab, server.js ~5.6k lines)
  + `matriya-system` (modular rebuild). Canonicalization unresolved (D1).
- Boundary work lives on branch `claude/authority-before-intelligence-m4t1zz`: migrations 007–014
  **additive and NOT run**; registries are configs (DRAFT/NOT_DEPLOYED); 35 tests green.
- Nothing deployed to production. Gate to deploy = the schema-reconciliation decision.

## 10. Roadmap
```
[built]   authority + engine + registries (branch)
   │
[human]   pick reconciliation Option (C recommended) → run migrations 007–014
   │
[Rachel]  one MME (T_noise) + one spec (T_relevance) + first density→fire run (plaster)
   │
[auto]    ingest → deriveBoundary → first VERIFIED boundary → decision_shift
   │
GATE B    one boundary that changed a decision
   │
Phase C   full engine: inference + navigation map + closed-loop next-experiment
Phase D   consolidation (D1 codebase, server.js split, multi-tenancy, CI)
```

---
*v1.0 — derived from four converging sources: the development work, the MATRIYA docs/registries,
the lab data, and the MATRIYA_Workplan. Update the version when a layer's design changes.*
