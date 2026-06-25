# Schema reconciliation — our boundary layers ↔ MATRIYA workplan ↔ live DB

> Critical finding from reading David's Drive files (registries, E-010/E-011, schema dump,
> MATRIYA_Workplan). Two independent efforts converged on the SAME architecture with
> DIFFERENT vocabulary — and the live DB already has tables that partly DUPLICATE what we
> built. This doc maps them so we converge instead of forking (Law 2 applied to our own schema).

## 1. The convergence (independent arrival = strong signal)
| What we built this session | MATRIYA_Workplan formal name |
|---|---|
| MME / noise_floor | **T_noise** — PRR Layer 0 (full-pipe variance under protocol) |
| pre-registration ("lock thresholds before measuring") | **declaration precedes measurement** (T_relevance signed by R&D lead) |
| outcome_spec + deriveBoundary | **Decision Boundary = max(T_noise, T_relevance)** + **Knowledge State** |
| "a boundary is valid only in its context" | **Protocol Context** + state **NOT_ISOLATABLE** |
| calibrate before discover (E-011) | **Phase 0 — PRR Trial** (6 specimens, 3+3) |
| observation contract | the **PRR / Claim** objects (designed, not yet in code) |
| boundary derivation / direction | **Claim = Relation + Decision Threshold**, direction_of_good |

The workplan's vocabulary is more mature. **Recommendation: adopt PRR / Claim / T_noise /
Knowledge State as the canonical names; treat our code as their first implementation.**

## 2. The duplication risk (live DB already has these)
The production schema (64 tables) already contains, parallel to our additions:
| Our addition | Live DB equivalent | Action |
|---|---|---|
| `observations` (contract) | `measurements` (test_date, days_since_production=age, measurement_temperature_c, spindle_type=instrument) **+** `outcomes` (mechanism_tag, failure_signature, conclusion_status) | **Reconcile** — don't ship a 3rd parallel table. Map observation fields onto measurements+outcomes, or formally supersede them. |
| `materials` seed + aliasResolver | `materials`, `material_library`, `formulation_materials` (material_name, recommended_material, functional_group) | Wire the resolver into `formulation_materials.recommended_material`. |
| `experiments`/conditions | live `experiments` already has `conditions` jsonb, `decision_shift`, `breakdown_flag`, `validated`, `formulation` jsonb | Our KPI "decision-changing boundary" = `experiments.decision_shift` (already exists!). |
| `axes`, `equipment`, `property_couplings`, `mechanism_hypotheses` | **none in live DB** | Genuinely new — safe to add. |

**The risk:** shipping `observations` as a new table while `measurements`/`outcomes` exist
would create exactly the fracture we are fixing (two non-canonical homes for the same
fact). Before running migration 007, decide: extend `measurements`/`outcomes` to satisfy
the contract, OR migrate them into `observations` and deprecate. This is a human/lab+David
decision — flagged, not auto-resolved.

## 3. What is genuinely new and additive (safe)
- Axis Authority (`axes`, migration 010) — live DB has no canonical property/axis table.
- Equipment Authority (`equipment`, 011) — new layer.
- Coupling registry (`property_couplings`, 012) — the trade-off boundary map (E-010).
- Mechanism hypotheses (`mechanism_hypotheses`, 013) — K-stage levers + to_verify.
- The pure libs (contract gate, deriveBoundary, contradictionDetect, formulationRules,
  measurementCoverage, aliasResolver) — logic, no schema conflict.

## 4. The four-layer model (workplan) vs our layers
| Workplan layer | Object | Our code |
|---|---|---|
| Layer 0 | PRR (Protocol Reproducibility Record, T_noise) | axes.noise_floor + the MME protocol in RACHEL-LAB-WORKPLAN |
| Layer 1 | Claim (relation + threshold + binding + protocol context) | observation + deriveBoundary + known-boundaries |
| Layer 2 | Decision Boundary = max(T_noise, T_relevance) | deriveBoundary σ + outcome_spec (needs T_relevance from lab) |
| Layer 3 | Knowledge State (SUPPORTED/REFUTED/INCONCLUSIVE/NOT_ISOLATABLE) | outcome_class (needs the state machine) |

## 5. Recommended next moves (when DB + David/Rachel available)
1. **Decide the observations↔measurements/outcomes question** before running 007 (avoid the fork).
2. Adopt PRR/Claim vocabulary; rename or alias our objects accordingly.
3. Reuse `experiments.decision_shift` for the decision-changing KPI.
4. Keep the new layers (axes/equipment/couplings/mechanisms) — they fill real gaps.
5. The Phase-0 PRR Trial (workplan) == our E-011 calibration; same 6-specimen T_noise protocol.

## Bottom line
We did not duplicate by mistake — we re-derived the same architecture and surfaced a real
convergence with David's design. The one hazard is shipping `observations` beside
`measurements`/`outcomes`. Resolve that as a human decision; everything else converges cleanly.
