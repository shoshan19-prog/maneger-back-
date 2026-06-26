# Ground Truth — measuring the spec parser against human labels

Step 4–5 of the K-closing sequence (Fresco). We measure the extractor against **human-confirmed
labels**, not against itself — otherwise a confusion matrix is parser-vs-parser (meaningless).

## Why
A confusion matrix only means something if `truth` is correct. So the flow is:
1. generate a skeleton (truth pre-filled from predictions, `confirmed:false`),
2. **a human corrects the `truth` and flips `confirmed:true`**,
3. score: re-run the extractor and compare to confirmed truth.

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
