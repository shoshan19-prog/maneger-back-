# CLAUDE.md — maneger-back / MATRIYA Boundary Intelligence

## Standing mindset (apply to EVERY task — not optional)

1. **Always improve, never just execute.** On every task, find at least one way to make
   it better than asked — a sharper check, a reusable tool instead of a one-off, a flaw
   caught early. If you do something twice, codify it (script/skill).
2. **Always connect threads.** Before finishing, ask: how does this connect to the north
   star (boundary map), to existing components (the contract, the axes, the plan), to past
   decisions and to what comes next? State the connection. Nothing stands alone.
3. **End each substantive task with a short "Improvements & threads" note:** (a) one way it
   or the tooling could be sharper next time, (b) how it links to the rest of the system.

## Operating protocol (autonomy — default mode)

When given a task: **start → execute end-to-end → self-review → report.** Do not stop
to ask approval for each routine step; routine safe actions are pre-approved in
`.claude/settings.json`. Work the whole task, then deliver a result with a short
self-review.

Still STOP and ask first for (not auto-approved by design):
- destructive/irreversible: force-push, `git reset --hard`, rebase, `rm -rf`;
- production data: writing to / querying the live Supabase (`psql`, `supabase db`);
- outward-facing: merging to `main`, opening PRs, sending email/Slack/external messages;
- anything that contradicts a decision already made in the thread.

Always end with the "Improvements & threads" note (below).

## Information-gap protocol (how to ask — standing rule)

When information is missing, do NOT assume the user can or should run a lab test, and do NOT
reflexively order a new experiment. First classify the gap into one of **three types** (executable
via `lib/gapClassifier.js` + `npm run gap`; ladder in `config/discovery_depths_v1.json`):
- **Knowledge gap** — answerable from the user's experience → ask ONE short question (e.g. "when
  you decide on adhesion, do you look at a single number or a body of evidence?").
- **Evidence gap** — no data exists at all; needs an experiment/measurement/lab access → do NOT
  ask the user to answer it; mark it explicitly **Requires Experimental Evidence** and stop.
- **Discovery gap** — data EXISTS but does not distinguish the competing hypotheses → mark it
  **Requires Deeper Observation**. The fix is NOT a re-run: ask for the **shallowest observation
  depth that would discriminate** H1 from H2 (macro photograph → failure mode → recoverability
  after remix → SEM → FTIR), not a full battery. (Worked case: "viscosity dropped" → reversible
  separation vs irreversible failure → recoverability-after-remix, no SEM/FTIR needed yet.)

A Discovery Gap is formally a **Discriminating Evidence Gap** — see the **fourth primitive,
Discriminability** (`docs/DISCRIMINABILITY.md`, `lib/discriminability.js`, `npm run gap discriminate`):
the power of the *existing* evidence to tell competing explanations apart (NOT the same as Evidence —
a rich set has zero discriminability if H1/H2 predict identical values). **The boundary (hold this
line):** *MATRIYA does not determine which evidence is needed to decide between hypotheses; it checks
whether the evidence the scientist declared as discriminating actually exists.* So BOTH the hypotheses
AND their discrimination links are **human-authored**; if a hypothesis has no declared discriminator
the system **refuses** (`declaration_required`) rather than infer. The check is logical, not
scientific — it states "Cannot discriminate between H1 and H2 given current evidence", never a
recommendation. Feeds the kernel via `variables_distinguishable` → `evaluateFailSafe`.

A question's purpose is to reduce uncertainty maximally at minimum cost. Before asking, check:
(1) can the user answer from their own knowledge? (2) will the answer change the model? (3) is it
the highest information-value question available? If any answer is "no" — don't ask. Never request
a new experiment when existing knowledge can first narrow the possibility space. When lab data is
required, stop and flag the gap instead of burdening the user.

## FSCTM law track (K→C→B→N→L→Design)

- **LAW-AUTHORITY-001 (Domain-Validated Structural Law CANDIDATE — not yet a general law)**
  (docs/L-OBSERVATION-AUTHORITY-LAW.md): within the investigated observation domain, authority
  belongs to the observation **record** (value+conditions+uncertainty+provenance+context), not to
  a stored value; a property value is a *derived interpretation*. Has Statement · Boundary of
  validity · Falsifier. Derived via: structural contradiction → survivability test (only C
  survived) → N (docs/N-OBSERVED-PROPERTY-PRINCIPLE.md) → L. Promotion to a general law needs the
  same structure to reappear INDEPENDENTLY (by observation, not design) in ≥2 further domains
  (combustion/char, couplings, another decision system). **Design not yet started** — do NOT write
  schema/migration/API until Design is ratified. The bigger asset is the *methodology*
  (docs/METHODOLOGY-LAW-DISCOVERY.md), not this candidate.
- The reusable method itself: docs/METHODOLOGY-LAW-DISCOVERY.md.

## Canonical reference

- **`docs/MASTER-ARCHITECTURE.md` is the stable architecture (v1.0)** — start there. Session/
  progress notes (`SESSION-SUMMARY`, `STATUS-AND-ROADMAP`) reference it and describe only deltas.
  Component ownership/status: `config/architecture_authority_map.json`.

## The north star

MATRIYA is becoming a **Boundary Intelligence Platform**: its asset is an empirical map
of *where materials/formulations/processes break* — not "what is known". Value = where
the possibility space has been reliably ruled out.

## The laws (fixed)

1. Authority Before Intelligence — identity/evidence before reasoning.
2. Identity Before Aggregation — never aggregate over a non-canonical key.
3. Store observations, derive boundaries (LAW-BOUNDARY-001) — never store a boundary.
4. Capture wide, infer narrow — record all context; condition only on the critical subset.
5. A boundary is valid only within its established context.
6. Calibrate before discovering; pre-register before measuring.

## What exists (branch: claude/authority-before-intelligence-m4t1zz)

- **Three parallel knowledge sources** (`config/evidence_streams_v1.json`, docs/EXPERT-INTERVIEW.md):
  Document (what is written — validated by **Rachel** → Gold Standard; gates document fan-out),
  Experimental (what is measured — lab/E-012), and **Operational** (how Fresco works — validated
  by **David**; NOT in the docs; the unique asset; does NOT wait for Rachel). Operational
  knowledge is captured ONE question at a time (`config/expert_interview_queue_v1.json`,
  active_question) and classified: engineering_principle / production_strategy / operational_rule /
  decision_heuristic; every rule carries a confidence_scope (verified_for/not_verified_for/future).
- **7 knowledge libraries** (docs/KNOWLEDGE-LIBRARIES.md): Materials · SOP · Requirement ·
  Experiment · Decision · Knowledge Graph · **Engineering Playbook** (`config/engineering_playbook_v1.json`
  — rules of engineering practice / how Fresco thinks; David, verified, scope B-4+Dry Powder).
  Three knowledge types: Declarative / Procedural / Engineering.
- **Formula is a First-Class Entity — Schema v1.1** (docs/FORMULA-ENTITY.md, `config/formula_schema_v1.json`,
  `lib/formulaSchema.js` + `lib/formulaExtract.js`): Fresco's knowledge is `Formula → Functional Role →
  Component → PSD → Functional Interface → Process → Measurements → Performance`, NOT `Document → Specs`.
  Pipeline: Document → Formula Extraction → **Canonical Formula Object (v1.1)** → [LATER: Knowledge Graph →
  Experiment Linking → Project Knowledge]. **v1.1 three extensions:** (1) **Role is a separate entity**
  (`functional_roles[]`), NOT a field of Ingredient — role is formula-scoped (same material = Packing in
  one formula, Opacity in another); `validateFormula` rejects a `role` on an ingredient. (2) **Authority
  is two-dimensional** `{field: objective|interpreted|pending, source: document|measurement|instrument|
  heuristic|unknown}` — invariant: objective may never come from heuristic/unknown; pending ⇒ unknown
  (so you can later query "only measurement-backed" / "ignore heuristics"). (3) **Functional Interface**
  (`functional_interfaces[]`) — explicit layer between Component and Process, defined now but pending.
  `formula_id` PROVISIONAL pending **Q-009** (versioning) — don't aggregate across it yet. `npm run
  formulas` → `.corpus/formulas_v1.json` (proprietary, git-ignored; 8/8 valid).
- **Knowledge Graph — DERIVED, not stored** (docs/KNOWLEDGE-GRAPH.md, `lib/knowledgeGraph.js`, `npm
  run graph`): the layer above Schema v1.1. Law 3 — `graph(t)` is recomputed from canonical formulas,
  no persisted parallel truth, no migration. Chain `Formula → FunctionalRole → Component → PSD →
  [FunctionalInterface → Process → Measurement → Performance]` (tail pending). Every edge carries the
  two-dim authority → `subgraph(g,{source:'measurement'})` gives a measurement-only view. Answers
  (real data): formulasSharingPsd (0.8-1.4 in 4/8), coOccurringIngredients, rolesOfMaterial /
  materialsWithMultipleRoles (CaCO3 insight), authorityCoverage (54% document · 46% heuristic · **0%
  measurement** — honest), diffFormulas (V4→V5). Identity still provisional (Q-009 / Phase A5) — do
  not aggregate as canonical yet. Persistence is human-gated (map onto live DB, never a parallel store).
- **Knowledge Δ Engine — measures what we LEARNED** (docs/KNOWLEDGE-DELTA.md, `lib/knowledgeDelta.js`,
  `npm run delta`): not another entity — a layer that classifies CHANGE in knowledge into five types:
  **Identity Δ** (new formula/material) · **Composition Δ** (ingredient add/remove/re-proportion) ·
  **Authority Δ** (a datum MATURED: pending→interpreted→objective(document)→objective(measurement) —
  the deepest; knowledge becoming authoritative without changing what it's about) · **Boundary Δ** (a
  new boundary born) · **Evidence Δ** (evidence items added by axis). `summary.learned` is true ONLY
  if Authority/Boundary/Evidence moved — a pure composition edit is a *change*, not *learning*
  (representation ≠ generation, operationalized). Current corpus: Identity 42 · all others 0 ·
  measurement coverage 0% → `learned=false` (built a state, not yet learned — the honest gap). Gives
  each future experiment a value = how much it moves the Δ.
- **Experiment Linking — value = Knowledge Δ contribution** (docs/EXPERIMENT-LINKING.md,
  `lib/experimentLink.js`, `config/experiment_registry_v1.json`, `npm run experiments`): an experiment
  is measured by how much it MOVES knowledge, not which formula it links to. `learning_value =
  evidence×1 + authority×3 + boundary×5` (a born boundary > a matured datum > an evidence item;
  identity/composition don't count). Pre-registration declares `expected_contribution` BEFORE running
  → pending experiments ranked by PROJECTED Δ (the next-experiment lever); `actual_contribution`
  replaces it on completion; a pre-registered experiment is projected only, never folded into the real
  state. Registry: E-011 completed (value 64, all evidence, NO boundary — confounded) · E-012
  pre-registered (projected value 17, would BIRTH a boundary E-011 couldn't). A measurement carries
  source=measurement — the only path lifting measurement coverage off 0%. **Full chain now exists
  (in representation):** Document → Formula → Knowledge Graph → Experiment → Knowledge Δ → Boundary →
  Law. What's missing is not architecture but the first real measurement (human: Rachel/David/E-012).
- `migrations/007_observation_contract.sql` — Axis Authority + Observation Contract (append-only).
- `lib/observationContract.js` — the validation gate (single source of truth for ingest).
- `scripts/analyze_formulation.mjs` + skill `analyze-formulation-data` — analyze uploaded xlsx.
- `scripts/observation_lint.mjs` + skill `observation-lint` — validate observations pre-ingest.
- `docs/BOUNDARY-INTELLIGENCE-PLAN.md` — goals, KPIs, phases A–D, gates.
- `docs/RACHEL-LAB-WORKPLAN.md` — lab (Rachel) parallel daily plan.
- `docs/E-011-PREREGISTRATION.md` / `docs/E-011-calibration-result.md` — the experiment + finding.

## Key findings to remember

- Material identity is **fractured**: canonical `materials` vs per-project `material_library`
  (FK not enforced). Fixing this is Phase A5.
- "Expansion ratio" is **not** a canonical axis: it = CHAR_HEIGHT/FILM_THICKNESS. The
  controlling axis for fire protection is **CHAR_DENSITY**, not height/expansion.
- Existing experiment data has **no APP scan** (APP held ~24–27.5%); measurements live as
  free-text `results`. ~0% is boundary-grade until the contract is live.
- **Identity vs Process variables** (David, verified — docs/PRODUCTION-KNOWLEDGE-DAVID.md):
  identity vars (PSD/granulometry, cement/aggregate type, raw-material identity) → on deviation
  **Reject Material, never compensate via formula**; process vars (pH/viscosity/SG) → Adjust→
  Re-test→Release. Production starts at the **Identity Gate** (incoming material), not the formula.
  New objects: Premix, Identity Gate, Manufacturing Response, PSD Design. Formula = Binder +
  PSD Design + Functional Additives + Processing Strategy. **Verified scope: B-4 Primer + Dry
  Powder only** — do NOT generalize to finish coatings / other liquids.

## Drive seeds + live-schema convergence (read docs/SCHEMA-RECONCILIATION.md)

- David's Drive holds canonical seeds: property registry (= Axis Authority), equipment seed
  (= Equipment Authority), coupling registry (E-010), mechanism hypotheses, and the
  **MATRIYA_Workplan** — which formalizes the SAME architecture we built, different names:
  MME=**T_noise** (PRR L0), pre-registration=**declaration precedes measurement**,
  outcome_spec=**Decision Boundary=max(T_noise,T_relevance)**, "valid only in context"=**NOT_ISOLATABLE**,
  E-011=**Phase 0 PRR Trial**. Prefer the workplan's PRR/Claim/Knowledge-State vocabulary.
- **Duplication caveat (important):** the LIVE DB (64 tables) already has `measurements`,
  `outcomes`, and `experiments` (with `decision_shift`, `breakdown_flag`, `conditions` jsonb).
  Our `observations` table OVERLAPS these. Do NOT run migration 007 (observations) before a
  human decides whether to extend `measurements`/`outcomes` or supersede them — shipping a
  parallel table re-creates the fracture we're fixing. `axes`/`equipment`/`couplings`/
  `mechanism_hypotheses` are genuinely new and safe.

## Conventions

- ESM (`"type":"module"`). `materials.material_id` is TEXT; ids are UUID.
- Commit to the feature branch; end commits with the required Co-Authored-By / Claude-Session trailers.
- xlsx package lives in `../matriya-back/node_modules`.
- Two codebases exist (`matriya-back` monolith vs `matriya-system` modular) — unresolved (Phase D1).
- **No parser improvement without re-running against the Gold Standard** (`.corpus/gold_standard_v1.json`
  via `scripts/ground_truth.mjs score`). Every extraction-pipeline change is measured against the
  lab-validated set — so we know we improved the system, not just changed its behavior. (docs/GROUND-TRUTH.md)
