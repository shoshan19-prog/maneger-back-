# Architecture Authority Map

> Single source of truth for component ownership (David's request). Generated from
> config/architecture_authority_map.json. No more duplication/ownership debates.

| Component | Authority | Status | Decision |
|---|---|---|---|
| measurements | Production DB | VERIFIED | Keep — the measurement EVENT (production_run_id, age, temp, spindle, linkage_confidence) |
| outcomes | Production DB | VERIFIED | Normalize — wide named columns (ph, specific_gravity, jsonb) -> canonical axis rows in observations |
| experiments | Production DB | VERIFIED | Keep — already has decision_shift, breakdown_flag, conditions, formulation jsonb |
| materials | Production DB | PARTIAL | Canonicalize — make source of truth; aliasResolver feeds it; deprecate material_library as source |
| material_library | Production DB | PARTIAL | Demote — per-project view only, not a source of identity |
| formulation_materials | Production DB | PARTIAL | Wire resolver into recommended_material |
| observations | Migration 007 (branch) | PARTIAL | LAYER (recommended) — canonical-axis value rows FK->measurements; supersede outcomes' wide columns. DO NOT ship parallel. |
| axes | Migration 010 (branch) | VERIFIED | New — canonical Axis Authority (property registry). No live equivalent. |
| equipment | Migration 011 (branch) | VERIFIED | New — Equipment Authority. No live equivalent. |
| property_couplings | Migration 012 (branch) | HYPOTHESIS | New/Experimental — 0/15 verified (E-010 map) |
| mechanism_hypotheses | Migration 013 (branch) | HYPOTHESIS | New/Experimental — all status=HYPOTHESIS |
| competitor_benchmarks | Config (branch) | VERIFIED | Keep — external boundary evidence from real measurements |
| T_noise / MME (per axis) | Lab/Human | MISSING | Blocked on Rachel — axes.noise_floor |
| outcome specs (Works/Fails) | Lab/Human | MISSING | Blocked on R&D lead — declaration precedes measurement |
| E-011 / PRR Trial data | Lab/Human | MISSING | Blocked on lab run |

**Authority levels:** Production DB · Migration (branch) · Config (branch) · Lab/Human

**Status levels:** VERIFIED · PARTIAL · HYPOTHESIS · MISSING
