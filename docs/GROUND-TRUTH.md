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

## Workflow
```bash
node scripts/corpus_cache.mjs                 # snapshot the corpus (manifest: sha1/bytes)
node scripts/ground_truth.mjs skeleton        # write .corpus/ground_truth.json (truth pre-filled)
#   → edit each `truth` (product / family / document_type / specs), set confirmed:true
node scripts/ground_truth.mjs score           # confusion matrices + spec precision/recall
```

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
