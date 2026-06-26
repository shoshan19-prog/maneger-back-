# Fresco Production Knowledge — verified by David (R&D lead)

**Status:** real operational knowledge gathered from Fresco's R&D lead for the knowledge model
— not ideas. `validated_by: David · confidence: verified · 2026-06-26`. **Priority: HIGH** —
these change MATRIYA's structural model and must be reflected in the ontology **before** more
corpus extraction / fan-out. Encoded in `config/variable_classification_v1.json` +
`config/knowledge_model_v1.json` + `lib/measurementOntology.js`.

## 1. The fundamental distinction — Identity vs Process variables
| | Identity Variable | Process Variable |
|---|---|---|
| Defines | raw-material identity | arises during production |
| Examples | PSD/granulometry, aggregate type, cement type, raw-material identity | pH, viscosity, specific gravity |
| On deviation | **Reject Material** (no formula compensation) | **Adjust → Re-test → Release** |

This is the core insight: you do **not** change the formula to compensate for an out-of-spec
raw material.

## 2. Identity Gate — production starts at material identity, not the formula
```
Supplier → Incoming QC → (PSD · Material Identity · Certificate · Internal Standard)
   → PASS → Production
   → FAIL → Reject Material
```

## 3. Dry-powder philosophy — quality before production
`Approved Raw Materials → Automatic Dosing → Premix → Batch → Workability Test`
**not** `Produce → Find Problems → Correct`.

## 4. New objects in the model
- **Premix** — fixed composition (2 fiber types, foaming powder, cellulose thickener),
  prepared ahead, sealed bags, same every batch, **no separate Batch ID**.
- **Identity Gate · Incoming QC · Manufacturing Response · PSD Design · Material Identity ·
  Identity Variable · Process Variable** (see `knowledge_model_v1.json`).

## 5. B-4 Primer (official source: YES)
Production QC: pH · viscosity · specific gravity · **appearance/uniformity** (= no lumps / no
phase separation — **not** color). Manufacturing Response: appearance fail → **Hold Batch**;
pH/viscosity/SG fail → **Adjust → Retest**.

## 6. Dry mortars (different from primers)
**No** pH/viscosity QC. Actual QC: workability · accurate water ratio · visual application ·
incoming materials · PSD. Visual every batch; full workability verification ~every 15 batches.

## 7. Granulometry & the meaning of "formula"
Granulometry is **critical**; Fresco buys particle fractions separately and designs the PSD
in-house. Therefore:
```
Formula = Binder System + PSD Design + Functional Additives + Processing Strategy
```
— not just chemistry.

## 8. Supplier certificate — event-driven authority
Supplier CoA is **not** the final authority. Sufficient while there's no problem; on a failure →
deep investigation: Granulometry → Raw Materials → Supplier.

## 9. Authority scope — do NOT generalize
- **Verified:** B-4 Primer · Dry Powder products.
- **Not yet verified:** Finish Coatings · other liquid systems.

## Required next (before continuing parser work / fan-out)
Ontology updated ✅ · entities added ✅ · knowledge model updated ✅. **Do not continue fan-out
before these verified production concepts are incorporated** — done in this commit. The next
move remains human: Rachel's Gold Standard.
