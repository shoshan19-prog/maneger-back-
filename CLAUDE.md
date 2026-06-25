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

## Conventions

- ESM (`"type":"module"`). `materials.material_id` is TEXT; ids are UUID.
- Commit to the feature branch; end commits with the required Co-Authored-By / Claude-Session trailers.
- xlsx package lives in `../matriya-back/node_modules`.
- Two codebases exist (`matriya-back` monolith vs `matriya-system` modular) — unresolved (Phase D1).
