# E-011 (option 1) — Calibration Result on Existing Data

> Calibration of the boundary method against **existing** burn-test data, before
> running any new experiment. Source file: `INTUMESCENT_NEW_FORMULATIONS_20260505.xlsx`,
> sheet `בדיקת שריפה -פורמולציות מבוקרות`. Date of analysis: 2026-06-24.

---

## 1. Purpose

Test whether the boundary method can recover a **known** lab understanding from
data already in hand — and decide which axes are actually canonical — *before*
committing to a controlled experiment.

## 2. Data used

- 16 burn tests with usable numeric `Expansion ratio` **and** `Time to Failure`.
- Mix of Fresco controlled formulations (CE-003 series, ARIK) and competitor
  products (PROMAT, INTERCHAR 1090/1190, FIRETEX 5090, CHARCOAT).
- Tested under ISO 834 furnace profile; failure ≈ substrate reaching ~500 °C.

**Data-quality caveats (recorded, not hidden):** several rows are
`לא נבדק` / `לא ניתן למדוד`; several `Time to Failure` values are **interpolated**
because of furnace recording gaps / power outages (documented in the sheet notes);
n = 16, observational, not a designed experiment.

## 3. Key finding A — "Expansion ratio" is not a canonical axis

On the data, to 2 significant figures:

```
expansion_ratio  =  CHAR_HEIGHT (mm)  /  FILM_THICKNESS (mm)
```

15 of 16 rows match this identity almost exactly (e.g. 70 mm / 0.93 mm = 75.3 =
reported 75.3). Expansion ratio is therefore a **derived composite** of two scalar
axes, not a measurable scalar. Building a boundary on it violates the `is_scalar`
rule (migration 007) and aggregates over a non-canonical key.

→ **Consequence:** expansion is computed at query time, never stored as an axis.
The canonical scalar axes are `CHAR_HEIGHT`, `FILM_THICKNESS`, `CHAR_DENSITY`,
`TIME_TO_FAILURE`, `APP_LOADING` (seeded in migration 007).

## 4. Key finding B — more foam ≠ more protection

| Source | Char height | Time to Failure |
|---|---|---|
| Fresco | **50–70 mm** | **50–70 min** |
| Competitors | 24–45 mm | 62.5–**130** min |

Fresco produces the **tallest** char (~2× competitors) yet fails **fastest**.

Correlations (Pearson, n = 16):

| Pair | r | Reading |
|---|---|---|
| char height ~ TTF | **−0.63** | taller char → faster failure |
| expansion ~ TTF (raw) | −0.52 | confounded (see below) |
| film thickness ~ TTF | +0.41 | more material → more time (expected) |
| expansion ~ TTF/thickness | +0.63 | sign flips once thickness is controlled (n=3 Fresco — weak) |

The raw negative expansion↔TTF correlation is **confounded**: high-expansion
samples (Fresco) are thin; low-expansion samples (competitors) are thick.
No variable was isolated, so a clean metric boundary cannot be extracted from
this data — which is itself the empirical argument for a controlled experiment.

## 5. Key finding C — the controlling axis is density / integrity

Sheet notes describe the mechanism directly: Fresco char is *"soft, low density,
detached"*; competitor char is *"hard, dense"*. Tall, low-density foam detaches and
exposes the substrate; short, dense foam holds. The axis that governs protection is
**char density / structural integrity**, not height and not expansion ratio.

## 6. Calibration verdict

**PASS (in spirit) against known ground truth.** The lab already benchmarks against
these competitors precisely because they last longer, and already records its own
foam as soft/low-density. The method recovered exactly that understanding from the
raw data: *high expansion alone is not protective; density decides.*

**With explicit limits:** this is a confirmed qualitative boundary / correlation,
**not** a metrically validated boundary. n = 16, observational, confounded
(Fresco = thin+tall vs competitors = thick+short), TTF partly interpolated.

## 7. What this changes

1. Axis registry (migration 007) updated: `EXPANSION` removed; `CHAR_HEIGHT`,
   `FILM_THICKNESS`, `CHAR_DENSITY`, `TIME_TO_FAILURE`, `APP_LOADING` seeded.
2. The next controlled experiment should scan toward **char density** (and validate
   the density→TTF boundary), not expansion.
3. Open `[LAB TO CONFIRM]`: method + noise_floor (MME) for `CHAR_DENSITY` and
   `TIME_TO_FAILURE`, and the TTF outcome spec (Works/Borderline/Fails minutes).

## 8. Reproduction

Parse the sheet, keep rows with numeric `Expansion ratio` and `Time to Failure`,
coerce ranges to midpoints, drop `לא נבדק` / `לא ניתן למדוד`, compute Pearson
correlations and the height/thickness identity. n = 16.
