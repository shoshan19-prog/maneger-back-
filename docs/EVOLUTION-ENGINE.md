# Evolution Engine — the transition is the unit of learning

> Fresco's reframe: a version is a snapshot; a **transition** is learning. We don't want to know
> *what* changed — we want to know *why* it changed, and whether it survived. So the scientific unit
> is the transition, not the formula. `114 versions → 113 transitions → 113 decisions`.

## Four Δ types per transition (parent → child, along the human-declared `based_on` lineage)
| Δ type | measures |
|---|---|
| **Composition Δ** | which materials were added / removed / re-proportioned (≥0.3% = a decision, below = rounding) |
| **Process Δ** | mixing order / rpm / time / shear changed |
| **Reasoning Δ** | the rationale written (verbatim — SOP boilerplate like "ensure no foam / 3 min" is filtered out) |
| **Decision Δ** | `based_on` \| `fixed` \| `passed` \| `rejected` (from the note language) |

## Three pattern layers above the transitions
- **Trend** (`recurringChanges`) — a change that repeats across transitions is no longer an edit, it's
  a trend (e.g. water keeps dropping, TiO₂ keeps being trimmed).
- **Strategy** (`coOccurringMoves`) — family moves that always travel together stop being a formula
  and become a strategy.
- **Decision chain** (`problemFixes`) — a problem in the notes (foam, exotherm) → the change that
  accompanied it → (later) the structural fix.

Materials are abstracted to **functional families** (acid_source, binder, tio2, polyol, melamine,
fiber, water, thickener, antifoam, dispersant, coalescent, biocide) so a transition can be read at
the strategy level, not just per-material.

## On the real intumescent journey (119 versions, git-ignored corpus)
`npm run evolution` → 64 causality-valid transitions. Real findings:
- **Strategy `-melamine & -polyol` (21×):** the char-former pair (melamine + pentaerythritol) is
  **co-trimmed as a single package** across the whole journey — exactly the v037 note *"reduce
  melamine, reduce PM40"*, but shown to be a recurring strategy, not a one-off. The clearest
  human-authored engineering rule in the corpus.
- **Strategy `-binder & -tio2` (22×)** and **`-acid_source & -tio2` (20×):** solids were trimmed in
  coordinated groups, not one material at a time.
- **Trends:** water ↑/down-tuned, TiO₂ trimmed (26×), acid source reduced (25×) — the mid-2023
  EXOLIT→FRCROSS shift shows as `-acid_source` recurrence.
- **Decision chain — foam:** the dominant process problem, e.g. *"מאוד מוקצף הוספנו עוד אנטי קצף +
  עירבוב ידני"* / *"הקטנת מסמיכים … פיצול נוגד קצף"* (reduce thickeners, split the anti-foam dosing).

## Honesty / boundaries
- **Causality guard:** a parent must precede its child in time. With `based_on` being a bare suffix
  that **recycles across years** (Law 2: Identity Before Aggregation), a based_on that only resolves
  to a later-dated version is rejected — no future parents, no backward transitions.
- **Noisy lineage:** the `based_on` field (parsed from scanned sheets) is partly contaminated by the
  side-by-side layout; the robust signals are the trends/strategies that recur 20+ times. A cleaner
  re-parse keyed on `date+suffix` would sharpen the per-edge data — the right next refinement.
- **No performance yet:** transitions carry composition/process/reasoning/decision, but NOT a fire
  result — the burn data is not joinable to the version ids in this file. Link even 15 burn tests to
  versions and every transition gains an *effect*, turning "what changed" into "which CHANGES
  improved fire endurance".

## Where it lives
- `lib/evolutionEngine.js` — `buildTransitions`, `transition`, `changeTokens`, `recurringChanges`,
  `coOccurringMoves`, `problemFixes`, `resolveParent`, `familyOf`, `decisionStatus`. Pure.
- `tests/evolutionEngine.test.mjs` — 7 assertions. CLI: `npm run evolution`.

## The chain this completes
```
Version → Transition (Δ) → Pattern → Engineering Strategy → Performance (when fire tests are linked)
```
This is the engine that preserves not Fresco's knowledge but Fresco's **decision process** — the
reasoning that produced the knowledge.
