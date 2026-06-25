# MATRIYA Boundary Intelligence — Session Summary

## 1. What this session changed
The production system was **not** touched (nothing deployed/run). What changed is three things:
- **Direction:** MATRIYA reframed from a knowledge/answer system to a **Boundary Intelligence
  Platform** (asset = where materials/processes break, not what is known).
- **Foundation (on the branch):** the four identity/authority layers + the boundary engine
  were built and tested as code, ready to adopt.
- **Knowledge:** real findings extracted from the lab data + David's Drive registries.

## 2. Key findings
1. **"Expansion ratio" is not a real axis** — on the burn-test data it = char_height/film_thickness
   (a derived composite). The controlling axis is **char density / integrity**, not expansion.
2. **More foam ≠ more protection** — Fresco makes the tallest char (50–70mm) yet fails fastest;
   competitors (PROMAT/INTERCHAR/FIRETEX) win at low expansion with denser char.
3. **Independent convergence** — our architecture and David's MATRIYA_Workplan reached the same
   design with different names: MME=T_noise, pre-registration=declaration-precedes-measurement,
   outcome-spec=Decision-Boundary, calibration=PRR-Trial, context=NOT_ISOLATABLE.
4. **Duplication risk caught** — the live DB already has `measurements`/`outcomes`/`experiments`
   (with decision_shift, breakdown_flag). Our `observations` must LAYER onto them, not fork.
5. **INT-TFX coverage gap** — it measures fire-time but NOT expansion or char (both missing),
   while fire-retardant plaster measures density+char+fire-time. The controlling axis is the
   blind spot of the flagship project.

## 3. What was built (branch: claude/authority-before-intelligence-m4t1zz)
- **Identity:** material resolver + canonical seed; Axis Authority (26 properties, real
  EN/ASTM/ISO methods); Equipment Authority (25 instruments); per-project test registry.
- **Evidence:** Observation Contract (gate + endpoint), ingest/CSV/backfill, lint.
- **Engine:** boundary derivation (σ=MME/slope), contradiction detection, formulation rule
  checker, coupling registry (15), mechanism hypotheses (5), next-experiment proposer.
- **Coverage:** equipment×project work-gap (`/api/coverage?project=`).
- **Governance:** Architecture Authority Map, schema-reconciliation decision (Option C ready),
  evidence-based progress report, full test suite (35 assertions green), CLAUDE.md + skills.
- ~40 files, migrations 007–014 (additive, **not run**).

## 4. Status (evidence-based)
```
Infrastructure        ██████████ 100%
Identity              ████████░░  80%
Evidence Pipeline     ███████░░░  70%
Boundary Engine       ██████░░░░  60%
Laboratory Calibration █░░░░░░░░░  10%
Operational Validation ░░░░░░░░░░   0%
```
Overall ~53% (mean). The bottleneck is no longer code — it is **data-source unification +
empirical calibration**.

## 5. What's left — and who owns it
- **Human decision (Priority 1):** pick schema reconciliation Option A/B/C (C recommended,
  prepared). Unblocks running the migrations.
- **Lab / Rachel (the real bottleneck):** one MME (T_noise) + one PASS spec + run the first
  density→fire boundary on **fire-retardant plaster** (template ready: `first-boundary-plaster-template.csv`).
- **Then automatic:** ingest → derive → first verified boundary → if it changes a decision →
  **GATE B passed** → build the full engine (Phase C).

## 6. The one-line bottom line
The architecture is built and corroborated from four independent sources. Crossing GATE B now
needs **one human decision and one small lab run** — not more code.
