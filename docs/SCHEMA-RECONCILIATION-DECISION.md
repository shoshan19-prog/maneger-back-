# Schema reconciliation decision — observations vs measurements/outcomes

> Priority 1 (David). Made decision-ready: full field mapping from the live schema +
> three concrete options + a recommendation + a ready migration draft for the recommended
> path. The pick itself is a human/lab call; everything else is prepared.

## The two models are DIFFERENT shapes (not redundant duplicates)

**Live `measurements`** = a measurement EVENT (not a value row):
| col | meaning |
|---|---|
| id (PK) | |
| production_run_id (FK→production_runs) | what was measured |
| test_date, days_since_production | when / **sample age** |
| measurement_temperature_c, spindle_type | **conditions / instrument param** |
| linkage_confidence, linkage_note | **provenance/binding confidence** |
| raw_test_notes | free text |

**Live `outcomes`** (FK→measurements) = results as WIDE named columns:
`ph, specific_gravity, capacity_ratings (jsonb), failure_signature, stability_classification,
mechanism_tag, conclusion_status`. → heterogeneous, **not keyed on a canonical axis** → cannot
aggregate over axes (the Identity-Before-Aggregation problem, at the measurement level).

**Our `observations`** = canonical LONG format: one row per `(axis_id, value, unit, method,
conditions, provenance, uncertainty, outcome_class)`. This is exactly what boundary
derivation needs (aggregate over a canonical axis).

So they are **complementary layers**, not two copies of one thing.

## Field mapping
| observations field | lives in live schema as |
|---|---|
| (event) | `measurements` row (production_run_id, test_date, days_since_production, temp, spindle) |
| provenance | `measurements.linkage_confidence/linkage_note/raw_test_notes` |
| conditions.TEMPERATURE | `measurements.measurement_temperature_c` |
| conditions.age | `measurements.days_since_production` |
| axis_id + value + unit + method | **MISSING in live** — `outcomes` has named columns (ph, specific_gravity…), not canonical axis rows |
| outcome_class | `outcomes.conclusion_status` / `failure_signature` (free text) |
| (mechanism) | `outcomes.mechanism_tag` |

## The three options
- **Option A — Extend outcomes.** Add `axis_id, value, unit, method, uncertainty` to `outcomes`,
  make it the long format. Keeps 2 tables; mixes wide+long awkwardly.
- **Option B — Supersede.** Migrate measurements+outcomes into `observations` (1 table).
  Loses the clean event/value separation and the production_run linkage.
- **Option C — LAYER (recommended).** Keep `measurements` as the event (great provenance
  already). Make `observations` the canonical value rows with `measurement_id FK→measurements`;
  **normalize** `outcomes`' named columns into observation rows on canonical axes
  (ph→`ph`, specific_gravity→`density`, …); deprecate the wide `outcomes` columns over time.
  Drop the duplicate event fields from `observations` (they live in `measurements`).

## Recommendation: Option C
It respects existing provenance (production_run linkage, age, instrument), gets canonical
axes (the boundary requirement), and **avoids a parallel silo** — observations becomes the
normalization layer, not a competitor. This is Identity-Before-Aggregation applied to the
measurement layer itself.

## Ready migration draft for Option C
`migrations/014_observations_link_measurements.sql` (drafted, NOT run):
- add `observations.measurement_id UUID REFERENCES measurements(id)`
- a backfill view `outcomes_as_observations` that emits canonical-axis rows from `outcomes`
  named columns (ph, specific_gravity) for review before normalizing.

## What this unblocks
Once a human picks C (or A/B), migrations 007–014 can run in order, then Rachel's MME +
specs make the boundary engine live. **This is the single highest-leverage decision in the
project right now.**
