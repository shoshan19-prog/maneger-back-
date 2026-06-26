# MATRIYA Knowledge Governance (frozen architecture)

The project crossed from *building a parser* to *governing a knowledge system* (Fresco). This
freezes the governance frame so every future knowledge library (SOP, Experiments, Formula,
TDS) enters the SAME rules from day one. Run: `npm run gate`.

## Three gates, not one
| Gate | Question | Blocks if FAIL |
|---|---|---|
| **K — Knowledge Readiness** | Is the ground stable? | Fan-out (mass extraction) |
| **E — Extraction Quality** | Does the parser extract correctly? | Knowledge-library update |
| **A — Authority Readiness** | Is the knowledge lab-validated enough to decide on? | Decision-making |

A system can be technically fine (E green) yet not ready to make decisions (A red) — that's
why A is separate.

## Contract vs implementation (the key distinction)
Each check is tagged:
- **architecture** — depends only on the system → **enforced now**.
- **data** — depends on the Gold Standard → **declared now, locked later** (`pending`: never
  fails the build until thresholds are set on validated data).

```
Gate K   registry_consistency      [LOCK]  ✓ enforced
         corpus_integrity          [LOCK]  ✓ enforced (append-only sha)
         ground_truth_exists       [LOCK]  ✓ enforced
         authority_coverage_min    [pend]  >=80% verified   (awaits Gold Standard)
Gate E   spec_precision            [pend]  >=99%
         spec_recall               [pend]  >=99%
         product_detection         [pend]  >=99%
         family_detection          [pend]  >=98%
         parser_drift              [pend]  0 regressions vs Gold Standard
Gate A   verified_objects          [pend]  count
         provisional_objects       [pend]  count
         open_contradictions       [pend]  0
```
Current: Gate K architecture = PASS; all data = PENDING → **Fan-out BLOCKED** (correct — no
Gold Standard yet).

## Authority model (per knowledge object)
Two kinds of authority + a standing steward:
- **Document Authority** — which version is canonical: `official_source` · `superseded_by`.
- **Domain Authority** — who knows/decides: `owner` · `created_by` · `validated_by`.
- **Knowledge Steward** — the standing person responsible for KEEPING it maintained.

Owner can change; created_by is historical; validated_by is who approved; steward is who is
accountable going forward. Example today → in two years:
```
owner: Fresco          owner: Fresco
created_by: Rachel      created_by: Rachel
validated_by: Rachel    validated_by: David
knowledge_steward: Rachel   knowledge_steward: Lab Team
```

## Working principle (codified, see CLAUDE.md)
> No parser improvement without re-running against the Gold Standard.

## Sequence to unblock fan-out (discipline: validate knowledge first, harden enforcement second)
```
Architecture ✅ → Governance ✅ → Reference Corpus ✅ → Gold Standard ⏳ (NOW)
  → Confusion Matrix ⏳ → Threshold Lock ⏳ → Gate Automation ⏳ → Fan-out ⏳
```
1. Rachel validates the docs (sheet → merge) → **Gold Standard Dataset v1**.
2. Lock the `data` thresholds in `lib/governanceGates.js` (remove `pending`).
3. `npm run gate` → Gate K green → Fan-out ALLOWED.

## Gold Standard versioning (don't grow it too fast — Fresco)
Grow the validated set in deliberate steps so every parser change is re-measured as diversity
increases (not one big 100-doc dump):
- **v1 = ~10 docs** (validated well) — the durable first asset.
- **v2 = ~25 docs.**
- **v3 = ~50 docs.**

## Deferred backlog — implement ONLY after Gold Standard v1 is approved
These are automation *around* the process; they won't change `Gate K = Pending` today, so they
wait until the contract has been checked against real validated data (not placeholders):
1. **pre-commit / pre-fanout hook** — block fan-out actions when Gate K is red (enforce the
   "no fan-out before a green gate" principle mechanically).
2. **`gates.mjs` exit codes** — return non-zero on a failing gate so it can chain in CI
   (`npm run gate && npm run fanout`): a gate that stops, not just reports.
3. **`config/gate_thresholds.json`** — externalize the 99%/80% numbers so locking thresholds
   after Gold Standard is one reviewed config edit, and per-library thresholds become possible
   (TDS vs Formula).
*Rationale: validate the knowledge first, then harden the enforcement.*
