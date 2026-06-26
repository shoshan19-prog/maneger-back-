# Product Specification Library (B — v2, pre-scale)

The **T_relevance** side of the decision boundary, extracted from the lab's own sheets
(Drive: `laboratory/`). Built to be a *consistent knowledge base*, not just extracted values
(Fresco). `Decision Boundary = max(T_noise, T_relevance)` — this fills T_relevance; T_noise
still comes only from measurement.

## Three mechanisms run before the parser (Fresco's pre-scale requirement)
1. **Document Classifier** (`lib/docClassify.js`) — Formula Sheet / Product Specification /
   QC Sheet / SOP / Test Report, and family (liquid / cementitious).
2. **Parameter Dictionary** (`lib/parameterDictionary.js`) — every label (Hebrew/English/
   trade) → canonical axis. One place to teach a synonym.
3. **Unit Normalizer** (`lib/unitNormalize.js`) — raw → canonical, **traceable** (keeps the
   raw string). e.g. SG `1.3–1.5 g/cm³` → `1300–1500 kg/m³`.

## Three-state spec status (the key correction)
A Family-B dry powder is **not** "no spec" — its spec lives in another document.
- **Present** — in this sheet (e.g. B-4 pH 7.6–10, density 1300–1500 kg/m³).
- **External** — known to be specified, just not here (cementitious → compressive strength,
  adhesion, water absorption… live in QC-PLASTER / a spec doc).
- **Missing** — genuinely absent.

So the Gap List reflects a *real* gap, not a document-type artifact.

## Traceable record (per product)
```
product · family · document_type
specification:
  <axis>: { value:{min,max,unit}, method, source, confidence, normalization:{raw,canonical} }
present_non_standard: [{axis, reason}]      # B
needs_external_document: [axis]            # C
missing: [axis]                            # D
```

## Gap List — 4 categories (`config/product_specification_library_v1.json` → `gap_list`)
- **A Extracted Successfully** — ph, density (normalized).
- **B Present but Non-standard** — qualitative-only checks (uniformity, consistency,
  whiteness, applicability, packing_weight); declared-but-empty rows.
- **C External Specification Required** — wet_viscosity (liquids); compressive/flexural
  strength, water absorption, adhesion (cementitious).
- **D Unknown** — none so far.

## v2 status (4 products, focused)
B-4 פריימר אקרילי (pH + density) · כיחול עדין (density) · שכבה מיישרת (density) ·
הרבצה צמנטית BST3 (Family B → all External). Extracted, not hand-typed.

## Honest scoreboard note
Raises **System Readiness** (spec spine). Does **not** move the bolded zeros — specs are
criteria, not evidence; no boundary is derived from them.

## Scaling (only after Fresco's go)
Run the same three mechanisms + parser over every sheet in `laboratory/` via a fan-out
(one reader per sheet → same `extractSpecs`). The dictionary/normalizer/classifier keep the
output consistent across dozens of products.
