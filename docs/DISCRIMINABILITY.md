# Discriminability — the fourth primitive

> Discovered while sharpening the Discovery Gap (Fresco). It looked like a vocabulary tweak; it
> exposed a primitive the architecture had been missing.

## The three that were named
Knowledge · Evidence · Decision.

## The fourth that was hiding
**Discriminability** — the power of the *existing* evidence to tell competing explanations apart.

This is **not** the same as Evidence. An Evidence Set can be rich and still powerless:

```
Evidence Set A:  viscosity · pH · density        ← three good observations
H1, H2 both predict the SAME values for all three ← zero discriminability
```

Lots of evidence, no ability to discriminate. Quantity of evidence ≠ power to discriminate.

## The pipeline (with the new stage)
```
Question
   ↓
Observations
   ↓
Evidence Set
   ↓
Discriminability Assessment   ← NEW: can the declared discriminators separate the hypotheses?
   ↓
Decision
```

The assessment does **not** rate evidence quality. It asks one narrow, **logical** (not scientific)
question: *does the existing Evidence Set contain the observations the scientist declared would
distinguish the hypotheses?* If not:

```
Cannot discriminate between H1 and H2 given current evidence.   (Discriminating Evidence Gap)
```

This is not a recommendation and not a decision — only a statement that the current evidence space
does not separate two models.

## The boundary (the most stable point in the chain)
> **MATRIYA does not determine which evidence is needed to decide between hypotheses. It checks
> whether the evidence the scientist defined as discriminating actually exists.**

So **both** the hypotheses **and** their discrimination links are **human-authored**. It is not
enough to declare:
```
H1
H2
```
The scientist must also declare:
```
H1  is distinguished by  Failure Mode
H2  is distinguished by  SEM morphology
```
Only then can the system run its check — "Failure Mode present? SEM present?" — and report a
Discriminating Evidence Gap. If a hypothesis carries **no** human-authored discriminator, the
system **refuses** (`status: declaration_required`): inferring what discriminates would cross from
description into scientific inference — exactly the line we hold.

## What the system contributes (and what it never does)
- **Does:** a formal, logical detection of when competing models cannot be separated by the
  evidence that exists — using the discriminators the human pre-registered.
- **Never:** decides *which* evidence discriminates, ranks hypotheses, or recommends a conclusion.

This keeps MATRIYA fully **descriptive** while still delivering real value: it tells you, formally,
when you cannot yet choose between models — and that the missing item is a *declared* discriminator,
not "more data".

## Where it lives
- `lib/discriminability.js` — `assessDiscriminability(hypotheses, present, {ladder})`,
  `requireAuthoredLinks`, `toFailSafeSignal`, `PRINCIPLE`. Pure.
- `config/discriminability_v1.json` — principle · pipeline · boundary · declaration contract ·
  worked example.
- `tests/discriminability.test.mjs`.
- CLI: `node scripts/gap.mjs discriminate`.

## Threads
- **Kernel:** the existing `evaluateFailSafe` already emits `VARIABLES_NOT_DISTINGUISHABLE` but had
  nothing to *decide* distinguishability. `toFailSafeSignal()` feeds it `{ variables_distinguishable }`
  — and a `declaration_required` result asserts *nothing* (empty signal), so the kernel stays silent
  rather than guessing.
- **Discovery Gap:** the Discovery Gap (`lib/gapClassifier.js`) IS a Discriminating Evidence Gap;
  `fromDiscriminability()` maps an assessment onto the gap vocabulary, suggested depth = the
  human-declared, shallowest-cost missing discriminator.
- **Mechanism Registry:** `WP-001` (recoverability after remix) is the canonical human-authored
  discriminator for reversible vs irreversible failure — a watched pattern, `do_not_promote`.
- **FSCTM:** this is descriptive (K/observation) only — no Design, no inference, no recommendation.
