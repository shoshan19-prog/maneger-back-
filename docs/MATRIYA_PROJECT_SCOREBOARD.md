# MATRIYA — Project Scoreboard

> **Two measures, on purpose.** A single "% complete" conflates two different questions and
> misleads (internally and to investors): "the system is 90%" is heard as "90% of the science
> is done." It is not. We track engineering progress and scientific progress separately.
>
> Regenerate the live numbers: `npm run scoreboard` (knowledge KPIs are counted from the
> canonical configs, so this board cannot drift from reality).
>
> *Snapshot: 2026-06-25.*

| Dimension | Progress | Answers |
|---|---:|---|
| **System Readiness** | **88%** | How much of the system is *built*? |
| **Scientific Readiness** | **25%** | How much knowledge is *proven*? |

The gap between these two **is** the project status: the instrument is nearly built; almost
nothing has been measured with it yet. That is expected and healthy at this stage — but it
must not be hidden behind an averaged "53%".

---

## 1. System Readiness — 88% (engineering)

| Sub-metric | % |
|---|---:|
| Infrastructure (contract, endpoints, harness) | 100% |
| Identity / Axis Authority (axes, materials, equipment) | 88% |
| Evidence pipeline (ingest, preview, parser, converter) | 85% |
| Boundary engine (derive, contradiction, couplings, next) | 75% |
| Tooling & tests (64 assertions / 10 files) | 90% |

## 2. Scientific Readiness — 25% (empirical)

| Sub-metric | % |
|---|---:|
| Scientific scaffolding (axes defined, hypotheses, protocols, pre-registration) | 45% |
| **Validated knowledge** (boundaries from real data, verified couplings, reproductions) | **5%** |

The 25% is generous on its own — the **validated-knowledge** line (5%) is the brutally honest
one. We have the readiness to discover; we have not yet discovered.

## 3. Knowledge KPIs (counted from configs — grows with real work)

| Metric | Value |
|---|---:|
| Canonical Axes | 28 |
| Axes with a fixed measurement_protocol | 1 |
| Mechanism Hypotheses (seed) | 5 |
| Mechanistic Couplings | 16 |
| **Verified Couplings** | **0** |
| **Derived Boundaries (from real data)** | **0** |
| **Reproduced Boundaries** | **0** |
| **Decision Shifts** | **0** |
| Active Experiments | 1 (E-012) |

The bolded zeros are the real scoreboard. When the first turns to a non-zero — a boundary
derived from Rachel's E-012 data — Scientific Readiness moves for the first time on evidence,
not code.

---

## 4. Where the bottleneck now lives

For most of this project, every blocker was solved by **development**. That is no longer true.
The bottleneck has moved to the empirical loop:

```
Experiment  →  Evidence  →  Discussion  →  Decision
```

— which is exactly the point of MATRIYA. From here, progress on **Scientific Readiness** is
gated on the lab running E-012, not on more code. System Readiness can keep inching up
(corpus mining, live-DB reconciliation), but it is no longer where the value is.

## 5. How to read this with a partner / investor

- "System Readiness 88%" = the instrument is built and tested.
- "Scientific Readiness 25% (validated knowledge ~5%)" = the empirical map is just beginning.
- The asset is **Verified Couplings** and **Derived/Reproduced Boundaries** — today all 0.
  That honesty is a feature: it is precisely the value MATRIYA is being built to produce.
