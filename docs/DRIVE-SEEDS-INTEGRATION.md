# Drive seed files — integration (Axis + Equipment Authority)

The user uploaded canonical seed files to Google Drive (David, 2026-06-21). These are
the authoritative identity layers we'd been hand-seeding. Integrated below.

## Files found & what they are
| File | Role | Status |
|---|---|---|
| `property_registry_canonical_v1.json` | **Axis Authority** — 26 properties: unit, real method (EN/ASTM/ISO), `direction_of_good` (polarity), `evidence_tier`, aliases, material effects | ✅ integrated → `config/` + migration 010 |
| `LAB_EQUIPMENT_seed.json` | **Equipment Authority** — 25 instruments → property codes they measure + standards + coverage gaps | ✅ integrated → `config/` + migration 011 |
| `E-011_Capillary_vs_Adhesion_Falsification` | A fully designed falsification experiment (Capillary↑→Adhesion↓, Siloxane domain). Data cells empty | ⏳ needs the lab to run |
| `E-010_1_Coupling_Evidence_Registry` | Coupling evidence registry | noted |
| `MECHANISM_HYPOTHESIS_seed.json`, `schema`, equipment manual | mechanisms / DB schema / acquisition | noted |

## What was integrated
- `config/property_registry_canonical_v1.json` + `config/lab_equipment_seed_v1.json` —
  the canonical sources committed to the repo.
- `migrations/010_axes_canonical.sql` — 26 canonical axes (adds `direction_of_good`,
  `evidence_tier`, `method_alias`, `codebook` columns). **Supersedes the hand axis seeds**
  in 007/008 (snake_case ids per decision D6): EXPANSION→`expansion_ratio`,
  TIME_TO_FAILURE→`time_to_failure`, CHAR_DENSITY/HEIGHT→`char_quality`+`density`,
  ADHESION→`pull_off_adhesion`.
- `migrations/011_equipment.sql` — new `equipment` table + 25 instruments.
- `scripts/gen_canonical_seeds.mjs` — regenerates both migrations from the configs (DRY).
- `lib/measurementCoverage.js` (+ tests) — joins axis↔equipment: which axes are
  measurable here, and with which instrument.

## The key convergence (again)
The registry independently confirms our two empirical findings:
- It lists **`char_quality`** (cohesion/structure) as a SEPARATE proven property — i.e.
  the density/integrity axis our calibration identified as the real controlling variable.
- `expansion_ratio` and `time_to_failure` are separate, and adhesion (`pull_off_adhesion`)
  links to APP with effect **down** — matching the expansion/adhesion delamination boundary.

## Coverage result (measurable vs gaps)
**16 / 26 axes are measurable with existing equipment.** Reported gaps:
`capillary_absorption, water_absorption_pct, suspension_stability, foam, open_time,
workability, compressive_strength, flexural_strength, density, salt_scaling_resistance`.

Honest caveat: some "gaps" are **codebook-mapping gaps, not equipment gaps** — e.g.
`density` (Density Cup, EN 1015-10) and `compressive/flexural_strength` (GOTECH press,
EN 1015-11) ARE measurable, but the registry left their `codebook` null (flagged in the
registry's own open_todos). Real equipment gaps: `capillary_absorption` (no rig),
yield-stress/oscillatory rheometer, MIP pore, LCA CO₂.

## Status & what still needs the lab
- Both registries are marked `DRAFT / HUMAN_REVIEW / NOT_DEPLOYED`, `writes_to_db:false`.
  Migrations 010/011 are **additive and not run** — promote after human review.
- Still missing (Rachel): **MME (noise floor) per axis**, **outcome specs** (Works/Fails),
  and the actual experiment data (E-011 cells are empty).
