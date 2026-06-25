# Rachel's lab test-process report — capture & reconciliation (2026-06-25)

Rachel sent the full, per-project test process for the lab. This is the **authoritative
method specification** — it both *corrects* and *expands* what the system held. Captured into:

- `config/lab_test_methods_v1.json` — **new.** Canonical `test → axis → unit → equipment →
  method → conditions` registry (the method detail the Axis Authority's commensurability
  rule needs). Single source for the contract + analyzer.
- `config/project_test_registry_v1.json` — **v1 → v2.** Reconciled per-project done/planned/gap.
- consumers updated (`lib/measurementCoverage.js`, dashboard) for the `missing → gap` rename;
  one stale test fixture corrected.

## Corrections (data the system had wrong)

| Project | Was | Now (Rachel 2026-06-25) |
|---|---|---|
| **ERL-ONE** | "unspecified" | **Paint remover / stripper** — comparative strip efficacy on our acrylics vs competitor (spatula + Garnik), plus an outdoor painted-wall test. |
| **PR-TFX** | corrosion (hours) = done | Salt spray is **future** (`בעתיד`). Today only pH/SG/viscosity are measured. |
| **ETL-ONE** | DFT/drying/salt-spray = done | Salt spray + pull-off + cross-cut are **future**; dry-film thickness is done. |
| **INT-TFX** | expansion_ratio = missing | Expansion factor **is** measured today (as a composite). |
| **TEL_AVIV_PLASTER** | sieving + compressive + SG | Narrowed to application + wall adhesion + sieving; compressive strength belongs to **QC-PLASTER**. |

Added QC workflows that were absent entirely: **QC-PAINT, QC-PLASTER, QC-COMPETITOR**.

## Three structural findings (these matter for boundaries)

1. **Universal QC core.** Almost every project starts with the *same* three measurements —
   `pH + specific_gravity + viscosity_profile` — before diverging by domain. That shared
   baseline is now named (`universal_qc_core`).
2. **Viscosity is a profile, not a scalar.** Spindle 1–4 × RPM {6,12,30,60} at 25 °C is a
   thixotropy curve. Each (spindle, rpm) is its own observation; **aggregating across shear
   rates is invalid** (Law 2 / commensurability). The contract must keep them distinct.
3. **The composite-axis trap, confirmed by the lab itself.** Rachel's step 15:
   *expansion factor = foam height ÷ initial paint thickness.* This is exactly the
   `CHAR_HEIGHT/FILM_THICKNESS` composite flagged in CLAUDE.md — it is **derived, not
   measured.** Capture the two primary components; never store the ratio as a primary axis.
   And the controlling fire axis is **char DENSITY**, which today is only judged *visually*
   (`foam density after burn`) — so it's the real INT-TFX work gap, not expansion.

Plus a commensurability landmine: **INT-TFX fire time is a project protocol** ("heat to
500 °C, count minutes"), **not EN 13381-8.** The method string must say so or the values
silently look comparable when they aren't. (`lab_test_methods` carries an explicit
`method_alias_warning`.)

## What this unblocks / the new-axis backlog

Rachel's report surfaces the next Axis-Authority work (so observations stop mapping to
`null`): **`ph`** (referenced by *every* project, still uncanonical) → add first; then
`whiteness` (L*/CIELAB), `corrosion_potential` (V, PalmSens4), and the visual/ordinal axes
(`foam_uniformity`, `char_height`, `blistering`, `delamination`, `rust_creep`,
`applicability`, `pigment_acceptance`, `strip_efficacy`, `sieve_residue`, `penetration_depth`).

These map straight onto the work-gap layer (`projectCoverage`) and feed
`GET /api/next-experiments` — every visual judgment that gains an instrument turns a
qualitative call into boundary-grade evidence.

## Connection to the north star

This is the **Trusted-Evidence input spec**: the upload gate (the Ingest button / contract)
can only accept what the Axis Authority can validate. Rachel just told us, per project, what
is measured, how, in what units, on which instrument, under what conditions — which is
precisely the metadata the contract checks. Closing the new-axis backlog (starting with
`ph`) widens what the lab can ingest as evidence rather than free text.
