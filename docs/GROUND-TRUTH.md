# Ground Truth — measuring the spec parser against human labels

Step 4–5 of the K-closing sequence (Fresco). We measure the extractor against **human-confirmed
labels**, not against itself — otherwise a confusion matrix is parser-vs-parser (meaningless).

## Two layers (Fresco)
Ground Truth is built in two layers so we don't fabricate lab judgment from memory:

- **Layer 1 — objective facts**, read from the document itself (near-mechanical): product,
  family, document_type, version/date, parameters present, values present, units.
  **Auto-filled** by `ground_truth.mjs skeleton`.
- **Layer 2 — professional knowledge**, confirmed by **Rachel**: is this the official doc? is
  a spec truly missing? External vs Not-Expected? does the parameter belong to the family? is
  there an alternative document? Left **pending** for the lab.

Plus **validation provenance** per record: `validated_by`, `validation_date`,
`confidence: verified | provisional`. So a year from now we know what was professionally
validated, what is still draft, and who approved each decision.

The corpus and the ground-truth file live under `.corpus/` (git-ignored — proprietary
formulations). Only the tooling is committed.

## Round 1 corpus (8 docs)
Real Formula Sheets: B-4 פריימר אקרילי, כיחול עדין, שכבה מיישרת (liquid) ·
הרבצה צמנטית BST3, טיח הידראולי, קרץ פוץ, חד שכבתי TLV5, מדה תעשייתית MD-1 (cementitious).

Document-type variety (TDS/MSDS/SOP) is **not** in this corpus — legacy 2014 .doc/.pdf
extracted empty, and fabricating evidence would violate Evidence-first. Those classifier
branches are instead covered by `tests/docClassify.test.mjs`.

## Workflow (validation interface, not a raw form)
```bash
node scripts/corpus_cache.mjs                 # snapshot the corpus (manifest: sha1/bytes)
node scripts/ground_truth.mjs skeleton        # auto-fill Layer 1 (objective) → .corpus/ground_truth.json
node scripts/ground_truth.mjs sheet           # export Rachel's validation sheet (.corpus/ground_truth_sheet.csv)
#   → Rachel fills the Layer-2 columns in Excel (see below)
node scripts/ground_truth.mjs merge --date 2026-06-26   # merge sheet → .corpus/gold_standard_v1.json
node scripts/ground_truth.mjs score --gt .corpus/gold_standard_v1.json   # score vs Gold Standard
```

### Rachel's columns (Layer 2 — the validation interface)
Left side is **read-only reference** (Layer-1 facts the parser read). Rachel fills the right side:
`official_source` (yes/no) · `superseded_by` (newer version, if any) · `missing_real_spec` (yes/no) ·
`external_vs_not_expected` (External | NotExpected) · `parameter_belongs_to_family` (yes/no) ·
`alternative_document` · `comments`. A row counts as **verified** once `official_source` is set.

The merged result is the **Gold Standard Dataset v1** — a permanent asset: every future parser
change is measured against it.

## Working principle (new)
> **No parser improvement without re-running against the Gold Standard.**
Every change to the extraction pipeline must be scored against `gold_standard_v1.json`, so we
know whether we improved the system or merely changed its behavior.

## What `score` reports
- **Confusion matrix** for `document_type` and `family` (truth → predicted).
- **Spec precision / recall / value-exact** (per-axis: TP/FP/FN, and whether min/max/unit match).
- **Product-name accuracy**.

## The gate (before fan-out on the full library)
Targets (from Fresco): Product detection >99 · Family >98 · Parameter normalization >99 ·
False-Missing <2. Only when the confirmed-label score clears these is a full run justified —
so a parser bug can't replicate across hundreds of documents.

## How to correct a label (example)
In `.corpus/ground_truth.json`, a doc whose family was misread:
```json
{ "source_file": "כיחול עדין.txt",
  "truth": { "family": "liquid", "document_type": "Formula Sheet",
             "product": "כיחול עדין",
             "specs": { "density": { "min": 1700, "max": 1900, "unit": "kg/m3" } } },
  "confirmed": true }
```
(Leave `predicted` untouched — it's the frozen reference for the diff.)
