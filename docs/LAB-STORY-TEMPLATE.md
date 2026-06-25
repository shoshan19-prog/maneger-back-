# Lab Learning-Story Template — empirical + measurement method (contract-grade)

> Built on Rachel's own PR-TFX structure. Keep writing the story as you do — this template
> just adds the few fields that turn prose into structured Boundary Intelligence (so the
> learning is never lost and the system can derive boundaries from it).
> Copy this per experiment. ✅ what's new vs the existing format is marked.

---

## 0. Header
- **Project:** (INT-TFX / PR-TFX / fire-retardant plaster / …)
- **Formulation id + version:** (e.g. 04.03.2026-004)
- **Goal of THIS run (one line):** what you're trying to learn/change.
- **Operator + date:** ✅ (provenance)

## 1. Formulation
Material table as today (חומר / אחוז / משקל / משקל בפועל).
✅ Use **canonical material names where known** (APP, MELAMINE, PER…) — aliases are fine,
the system resolves them.

## 2. Changes made (and why)
As today — the deviations from plan and the reason.

## 3. Problems during prep
As today — what went wrong, what you tried.

## 4. Tests — measurements ✅ (the key addition)
For **each** measurement, one row. This is what makes it ingestable:

| Property (axis) | Value | Unit | Method/standard | Conditions (temp/age/thickness/substrate) | Replicates / uncertainty | Outcome |
|---|---|---|---|---|---|---|
| e.g. film thickness | 55 | micron | thickness_gauge_avg | 2 coats, 4 days | n=5, ±? | — |
| e.g. fire time | 66 | min | EN 13381-8 | ISO 834, DFT 130µm | n=3, ±2 | works |

> The 4 fields that must not be missing: **value, unit, method, and the conditions** —
> because a value without its method/conditions can't be compared or reused (it's lost).

## 5. Results
As today — narrative of what the panels/tests showed over time (24h / 8d / 10d…).

## 6. What we learned — **the boundary** ✅
State it as *where it breaks*, in one of these shapes:
- **Threshold:** "below ~X [unit, method] the system fails" (e.g. below ~120 kg/m³ char
  density → fails the 60-min rating).
- **Incompatibility:** "A + B → failure" (e.g. potassium silicate + this primer → shock).
- **Open question / what to isolate next:** the one-variable experiment that would confirm it.

## 7. Supporting files
Photos / data files as today.

---

### Why these 4 extra fields matter (the one principle)
A measurement **without its method, unit, and conditions cannot be compared** to any other —
so it can't become a boundary; it stays an anecdote. Recording them turns every run into a
permanent, reusable data point. *Capture wide (all conditions), infer narrow (only what
matters).* This is exactly the empirical discipline you described to Rachel.
