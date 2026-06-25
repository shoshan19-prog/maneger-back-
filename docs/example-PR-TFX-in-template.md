# Worked example — PR-TFX 004 in the Lab Learning-Story template
*(reference for Rachel: her own data, re-cast into the template so she sees the small delta)*

## 0. Header
- **Project:** PR-TFX (anti-corrosive primer for intumescent paints)
- **Formulation id + version:** 04.03.2026-004
- **Goal of this run:** find a way to add potassium silicate without "shock" (gelation).
- **Operator + date:** Rachel · 2026-03-04

## 1. Formulation
(materials table as in the original — water 27.9%, OROTAN 731 1%, … KSIL34 15%, CC401 5%,
silicone additive 2%, BETOLIN A11 2% …)

## 2. Changes made (and why)
Mixed up to the emulsion; prepared KSIL34+water aside; replaced un-addable potassium silicate
with +5% emulsion 2403 + 3.8% water; added 10% zinc dust after CC401.

## 3. Problems during prep
Every potassium-silicate compatibility mini-test hardened on mixing.

## 4. Tests — measurements ✅
| Property (axis) | Value | Unit | Method/standard | Conditions | Replicates/uncertainty | Outcome |
|---|---|---|---|---|---|---|
| film thickness | 55 | micron | thickness_gauge_avg | 2 coats, 4 days | n=5 (avg) | — |
| cracking | micro-cracks | rating | visual inspection | 2 coats, 4 days | — | borderline |
| K-silicate compatibility | gel | pass/fail | add to 12–16 g aliquot, mix | KSIL34 at 20/35/50% water | 3 variants, all gel | fail |

## 5. Results
Nice smooth film with micro-cracks; ~55 µm average. Fewer cracks than 002/003.

## 6. What we learned — the boundary ✅
- **Incompatibility:** potassium silicate (any type/dilution) + this primer → shock/gelation.
  **Status: partially verified** (fails across all variants); culprit component not isolated.
- **Open question / isolate next:** add K-silicate to a system with ONLY zinc_borate; ONLY
  zinc_phosphate; ONLY melamine; ONLY each emulsion. The one that gels = culprit.

## 7. Supporting files
(panel photos)

---
*The only additions vs the original write-up: the §4 measurement table (value+unit+method+
conditions) and the §6 boundary statement. Everything else is exactly how Rachel already works.*
