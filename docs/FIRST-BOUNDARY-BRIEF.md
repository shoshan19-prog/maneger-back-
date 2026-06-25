# First Verified Boundary — focused brief (GATE B)

> One page. Goal: cross GATE B (one verified boundary that can change a decision) with the
> **smallest possible lab effort**, on the project that already measures the right axes.

## Why fire-retardant plaster (not INT-TFX)
From Rachel's coverage email: **fire-retardant plaster already measures Expansion, Density,
Char Integrity, and Fire-Resistance-Time.** INT-TFX does NOT (expansion/char are missing).
So the cheapest first boundary lives in the plaster project — no new test rigs needed.

## The boundary to verify
**CHAR_DENSITY → TIME_TO_FAILURE.** Hypothesis (from our calibration + the domain pack rule
expansion/adhesion<28.5 and char_quality mechanism): *below some char density the foam is too
soft, detaches, and fails faster.* This is the density>expansion finding, tested where the
data exists. Input axis = `density` (kg/m³); response = `time_to_failure` (min); outcome =
PASS/FAIL on the fire rating.

## Minimal ask from Rachel (3 steps)
1. **Noise floor (T_noise / MME)** — run **6 repeats of ONE stable plaster formulation**;
   record density + fire-time each. σ(fire-time) = MME. *(this is the only "extra" work)*
2. **Density scan** — **3–5 formulations** that vary char density (via binder / blowing
   agent), **straddling the suspected fail point**, **≥3 repeats each**. Record density +
   fire-time + char-integrity + PASS/FAIL. (Much may already exist in the plaster data.)
3. **Spec (T_relevance)** — the known PASS threshold on fire-time (the rating requirement),
   signed before analysis (declaration precedes measurement).

## What to fill
`docs/first-boundary-plaster-template.csv` — one row per sample. Columns map 1:1 to the
Observation Contract. Then: `node scripts/observation_lint.mjs <csv>` to check, and send.

## What I do the moment data arrives (automated)
`import_observations` → `observation-lint` → `deriveBoundary(input=density, mme=σ)` →
**first boundary** with location B̂, σ(boundary)=MME/slope, confidence interval, and
monotonic/separable flags. If the boundary changes a formulation decision → `decision_shift`
→ **GATE B passed**.

## Pre-registration (lock before measuring)
- **PASS:** boundary located, response Δ at the crossing > MME, monotonic Works→Fails, and
  B̂ within the lab's known band.
- **FALSIFY:** a low-density sample that still passes fire-time → density is NOT the controlling
  axis here (and that sample is the discovery). Either result is a win.
- Validity scope: fire-retardant plaster only (Protocol Context). Intumescent paint = separate.

## After GATE B
Only then build the full engine (Phase C) + extend to INT-TFX by closing its work gap
(start measuring expansion + adhesion, per `/api/coverage?project=INT-TFX`).
