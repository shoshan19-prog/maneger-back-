---
name: observation-lint
description: Validate a batch of observations (CSV or JSON) against the Observation Contract before ingest, using the same gate the live endpoint uses. Reports which rows fail and exactly why (missing fields, unit/method incommensurability, unknown axis, missing uncertainty). Use whenever the lab prepares a batch of measurements to enter the system, or to check a backfill extraction.
---

# observation-lint

## When to use
Before any observations enter the system — a lab batch, a CSV from Rachel, or rows
extracted by `analyze-formulation-data`. Catches contract violations early, identically
to how the live `/observations` endpoint will reject them.

## How to run
```
cd /home/user/maneger-back-
node scripts/observation_lint.mjs <observations.json|.csv> [--axes axes.json]
```
- Without `--axes` it uses the 5 axes seeded in migration 007.
- Input row fields: `project_id, axis_id, value, unit, method, uncertainty,
  replicate_count, conditions{}, provenance{source_type,source_reference,observed_by,observed_at}, outcome_class`.

## How to interpret
- **FAIL** = the live endpoint would reject it. Fix before ingest.
- Common fails: unit not commensurable with the axis (the key one — never aggregate
  incompatible units), missing provenance, unknown axis.
- **⚠ warnings** (e.g. missing uncertainty) are allowed but mean "not boundary-grade" —
  flag them; a point without uncertainty can't be judged against the noise floor.

## Output (always)
Summarize pass/fail, list the fixes needed, and add the **"Improvements & threads"**
note (CLAUDE.md): e.g. is a recurring failure a sign the entry template/UI should change,
or that an axis definition is missing? Connect the lint result back to the data pipeline.

## Related
- `lib/observationContract.js` — the gate (single source of truth for both this and the endpoint).
- `migrations/007_observation_contract.sql` — axis definitions.
- `docs/RACHEL-LAB-WORKPLAN.md` — the data-collection template these rows should follow.
