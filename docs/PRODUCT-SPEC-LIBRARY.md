# Product Specification Library (B — step 1)

The **T_relevance** side of the decision boundary, extracted from the lab's own formulation
sheets (Drive: `laboratory/`). "When is a result *good*" — per product. This is the half
that was empty until now; the other half (**T_noise / MME**) still comes only from measurement.

> `Decision Boundary = max(T_noise, T_relevance)` — this library fills T_relevance.

## What was extracted (v1, 3 products)
Run: `node scripts/extract_specs.mjs <sheet.txt ...>` → `config/product_specification_library_v1.json`

| Product | Spec | Source |
|---|---|---|
| B-4 פריימר אקרילי | pH 7.6–10 · SG 1.3–1.5 g/cm³ | QC block |
| כיחול עדין | SG 1.7–1.9 g/cm³ (pH row empty) | QC block |
| שכבה מיישרת | SG 1.7–1.9 g/cm³ (pH row empty) | QC block |

## Two template families (important for scaling)
- **A — liquid products (WK-200 style):** numbered QC block (`בדיקות`) with real ranges
  (PH, משקל סגולי…). **These yield specs.**
- **B — dry cementitious powders (FRESCO COLORS style):** formulation only; QC fields blank.
  Their specs (compressive strength @ 7/14/28d, etc.) live in the **QC-PLASTER** process,
  not in these sheets. **No specs to extract here** — flagged, not silently skipped.

## Gap List (the third output of the unified parser)
1. **Commensurability:** SG captured in **g/cm³**, canonical `density` axis is **kg/m³** →
   convert ×1000 (or split a `specific_gravity` axis). Surfaced automatically.
2. **Qualitative-only checks** (no numeric scale yet → spec-axis backlog):
   `uniformity` (אחידות) · `consistency` (סמיכות) · `whiteness` (לובן) ·
   `applicability` (ישום) · `packing_weight` (משקל לאריזה).
3. **Declared-but-empty:** pH row exists but unfilled on some products.

## Honest status
- This raises **System Readiness** (Knowledge Definition / spec spine) — it does **not**
  move the bolded scoreboard zeros. Specs are criteria, not evidence; no boundary is derived
  from them. T_noise still needs the lab.
- v1 covers **3 products** from the Family-A files read so far. Scaling to the full Drive
  library (dozens of products) is the next pass — best done via a fan-out that reads each
  sheet and runs the same extractor, so the mapping stays identical.

## How it plugs in
A product's spec becomes the `outcome_spec` / classification line: an observation on `ph`
for `B-4` is `works` iff 7.6 ≤ value ≤ 10. That is exactly what the boundary endpoint needs
to classify works/fails once real measurements arrive.
