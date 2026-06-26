# Knowledge Architecture — the real achievement of 2026-06-26

The big step today is not another library. It is that MATRIYA stopped being a system that
*stores* knowledge and became one that *distinguishes the stages of knowledge* — the jump from
a "documents" mindset to a "research" mindset.

## The chain MATRIYA now represents
```
Question          (expert_interview_queue / pre-registration)
   ↓
Observation       (a single measured datum, through the contract)
   ↓
Evidence          (an observation with provenance + measurement protocol + confidence)
   ↓
Evidence Set      (observations sharing a context — what a boundary is derived from)
   ↓
Decision Library  (the LOGIC: question · alternatives · reasoning · evidence_used · authority ·
                   uncertainties · next_action · criteria — not just the outcome)
   ↓
Mechanism Candidate  (born from a CRITERION recurring across real decisions — data, not
                   impression; kept in a SEPARATE Mechanism Registry, Evidence Sets only link it)
   ↓
Rule Support Update  (each Evidence Set strengthens/weakens a rule — RuleSupport)
   ↓
Engineering Rule  (operational knowledge — how Fresco thinks; Engineering Playbook)
   ↓
Knowledge Graph   (validated, scoped, attributable)
```

**Decision Authority + data-driven mechanisms** (`lib/decisionLibrary.js`,
`config/decision_library_v1.json`, `config/mechanism_registry_v1.json`; `npm run decisions`):
we record *why* an engineer released one batch and rejected another. A criterion used across
≥N real decisions becomes a Mechanism Candidate — emergent, not asserted. Mechanisms live in
their own registry; an Evidence Set holds only `candidate_mechanisms: [MC-…]` links, keeping
investigations separate from the mechanisms that accumulate from them. (Empty today; the
"recoverability after remix" pattern is held as a *watched pattern*, explicitly NOT promoted —
too few evidence sets, one environment.)

**Knowledge Evolution (not just storage):** rules are living entities. `lib/ruleSupport.js` +
`config/rule_support_v1.json` (`npm run rules:evolution`) link each rule to the Evidence Sets
that support/contradict it and derive a status: asserted (expert-only) → single_support →
supported → promotion_ready (→ candidate verified coupling/mechanism), or contested/refuted.
This answers: what strengthened this week, what is contradicted, which rule is fragile (one
evidence set), which is ready to be promoted. Empty today (0 evidence sets) — every rule is
`asserted` until real evidence flows.
Each stage has its own authority, validator, and confidence — none is collapsed into "a fact
in a document."

## Why it matters for the scoreboard
This is why a single "% complete" is wrong, and why the board now has **three** dimensions:
- **Infrastructure Readiness** — the chain exists and is enforced (repo, governance, gates,
  ontology, libraries). High (~92%).
- **Knowledge Readiness** — how much real knowledge is captured & structured along the chain
  (Document / Experimental / Operational). Advanced today (~38%).
- **Scientific Validation** — how much is *proven* (verified couplings, derived/reproduced
  boundaries, prediction, external validation). Still ~5% — the chain is built, almost nothing
  has flowed all the way through it yet.

## The honest read
Today bought **Infrastructure + Knowledge architecture**, not Validation. The chain is ready;
real data (Rachel's Gold Standard, David's operational answers, E-012 measurements) is what
will move Validation. Architecture is intentionally ahead of data.
