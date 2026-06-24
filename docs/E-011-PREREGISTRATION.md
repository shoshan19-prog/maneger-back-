# E-011 2.0 — Pre-Registration (Boundary Intelligence, Phase 0)

> **Status:** pre-registration. Fill every `[LAB TO CONFIRM]` *before* running. Once
> data collection starts, this document is frozen — changing success/failure
> criteria after seeing data invalidates the calibration.

---

## 0. One-line purpose

**This is a calibration, not a discovery.** The goal is *not* to find a new
boundary. The goal is to verify that the system can **recover a boundary the lab
already knows**, under controlled conditions, with a measured noise floor.

If the instrument cannot rediscover a known answer, it cannot be trusted on
unknown ones — and the Boundary Intelligence initiative stops here.

---

## 1. What is being tested (and what is NOT)

| | |
|---|---|
| **Hypothesis under test (measurement)** | The system can locate the Works→Fails boundary on a known axis to within its propagated noise, matching lab ground truth. |
| **NOT tested here (value)** | Whether boundaries change real decisions, compose, or transfer. That is a separate, later experiment. A successful E-011 2.0 does **not** prove the business thesis — only that the instrument is calibrated. |

---

## 2. Baseline system (locked)

- **Formulation family:** `[LAB TO CONFIRM — e.g. DRY-EXP series]`
- **Everything except the scanned input is LOCKED and recorded** (capture wide):
  binder, fillers, mixing speed, DFT, substrate, drying process, sample age,
  ambient T/RH. Lock list: `[LAB TO CONFIRM]`

---

## 3. Axes (commensurability fixed up front)

A boundary lives between two distinct axes. Do **not** conflate their units.

| Role | Axis | Canonical unit | Method / instrument |
|---|---|---|---|
| **Input (scanned)** | APP loading | `[LAB TO CONFIRM — %w/w]` | gravimetric formulation |
| **Response (measured)** | EXPANSION | `[LAB TO CONFIRM — ratio 'x' or '%']` | `[LAB TO CONFIRM — free expansion test]` |

Both axes must already exist in the `axes` registry (migration 007). EXPANSION is
seeded; **add APP loading before running.**

- **Noise floor (response):** `MME(EXPANSION) = 1.44` — in EXPANSION units.
  Confirm this floor is axis-and-method specific for the locked baseline:
  `[LAB TO CONFIRM the runs MME=1.44 was derived from]`

---

## 4. Pre-registered ground truth (the known answer)

The calibration is only meaningful if the lab's known boundary is **sharper than
the tolerance** (Section 7). State it quantitatively, not as a wide band:

- Lab-known boundary location: `APP ≈ [LAB TO CONFIRM, e.g. 23] %w/w`
- Lab confidence on that location: `± [LAB TO CONFIRM] %w/w`  ← **must be smaller than the Section-7 tolerance, or the test cannot fail.**
- Outcome spec on the response (the Works/Borderline/Fails thresholds on EXPANSION):
  - `Works:    EXPANSION [LAB TO CONFIRM, e.g. > X]`
  - `Borderline:EXPANSION [LAB TO CONFIRM, between X and Y]`
  - `Fails:    EXPANSION [LAB TO CONFIRM, < Y]`

These numbers come from existing Fresco knowledge — **not** from a hypothesis,
and **not** invented by the system.

---

## 5. Design (resolution that can actually locate the boundary)

3 spaced points cannot pin a boundary to ±1.5%; they only bracket an interval.
Put points **straddling** the suspected crossing, plus anchors that the lab is
certain about:

| Point | APP (%w/w) | Expected class | Purpose |
|---|---|---|---|
| Anchor-W | `[~15]` | Works | confirm the safe side |
| Cross-1 | `[~21]` | Works/Borderline | straddle |
| Cross-2 | `[~23]` | Borderline | at suspected crossing |
| Cross-3 | `[~25]` | Borderline/Fails | straddle |
| Anchor-F | `[~28]` | Fails | confirm the fail side |

- **Replicates:** ≥ 3 per APP level (needed to estimate within-level σ, not just
  compare to the global MME). Total ≈ 5 levels × 3 = **15 runs** `[LAB TO CONFIRM feasibility, incl. aging time]`.
- Every run is recorded as an **observation** (migration 007 / `lib/observationContract.js`):
  `axis_id=EXPANSION, value, unit, method, uncertainty, replicate_count,
  conditions={APP_LOADING:{value,unit}, T, RH, ...}, provenance, outcome_class, outcome_spec_ref`.

---

## 6. Boundary derivation (store points, derive boundary)

Boundaries are **not** stored. From the observations:

1. Classify each run via the Section-4 outcome spec → Works / Borderline / Fails.
2. Locate the boundary = the APP value where the response crosses the spec
   threshold (interpolate between the bracketing points).
3. **Translate response-noise to boundary-location uncertainty via the local slope**
   (this is the commensurable step — do not apply MME(EXPANSION) directly to APP):

   ```
   σ(boundary, APP)  ≈  MME(EXPANSION) / |dEXPANSION/dAPP|   (local slope from the straddling points)
   ```

---

## 7. Success criterion (commensurable)

Let `B̂` = boundary location computed from observations (in APP %w/w), with
uncertainty `σ(boundary, APP)` from Section 6. Let `B*` = lab-known location
(Section 4).

> **PASS** iff `|B̂ − B*| ≤ 2 · σ(boundary, APP)`  **and** monotonic ordering
> Works→Borderline→Fails holds across the APP scan.

Note the tolerance is `2·σ` **in APP units** — *not* `2·MME` in EXPANSION units.
PASS is only meaningful if lab confidence (Section 4) is tighter than this
tolerance.

---

## 8. Falsification — what a failure means (decided in advance)

| Observed result | Falsifies | Action |
|---|---|---|
| `|B̂ − B*|` > 2σ, but ordering monotonic | Either MME(EXPANSION) is wrong, or B* is mis-stated | Re-derive noise floor; re-check lab ground truth. Do **not** expand axes. |
| No monotonic ordering; response Δ < MME at all levels | No detectable boundary on APP for this baseline (or wrong response axis) | Stop. APP may not be the controlling axis here. |
| Ordering monotonic but slope ≈ 0 near B* | It's a gradient, not a regime change | Re-examine whether a "boundary" exists at all vs a smooth sensitivity. |
| Within‑level σ ≫ MME | Measurement not under control | Fix protocol/instrument before any boundary work. |

**Global stop rule:** if the system cannot recover a *known* boundary within
tolerance, the Boundary Intelligence initiative pauses and we revert to the
classical knowledge-system model. Calibration failure is decisive, not a nuance.

---

## 9. On success → next gate (not a green light to build everything)

A PASS authorizes exactly one thing: **add a second axis and repeat the
calibration.** It does **not** authorize the inference engine, navigation, or
coverage metrics. Those wait until the *value* hypothesis (a boundary changing a
real decision) is separately demonstrated.

---

## 10. Open decisions reserved to the lab head (Personal Veto)

1. APP and EXPANSION canonical units + EXPANSION method (Section 3).
2. The outcome spec thresholds on EXPANSION (Section 4).
3. The lab-known boundary location `B*` and its confidence (Section 4).
4. Feasibility of 15 runs given sample aging (Section 5).

Nothing in Sections 4–7 may be invented by software. The system's job is to
*recover* these, not to assert them.
