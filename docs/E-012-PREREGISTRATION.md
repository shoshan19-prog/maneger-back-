# E-012 — Pre-Registration: does char_density predict time_to_failure?

> **Status:** pre-registration (declaration precedes measurement). Fill every
> `[LAB TO CONFIRM]` *before* running. Once data collection starts this document is
> frozen — changing the success criterion after seeing data invalidates the result.
>
> **Conservative by design (per Fresco, 2026-06-25).** The goal is NOT to prove the
> chain. The goal is to test, carefully, whether a relationship even exists — and only
> upgrade the coupling if it holds across several formulations.

---

## 0. One-line purpose

Test whether **char_density → time_to_failure** (coupling **C16**) holds under fixed
measurement conditions. Until this experiment supplies a consistent series, **C16 stays a
`Mechanistic Hypothesis`, not a law.**

## 1. What is being tested (and what is NOT)

| | |
|---|---|
| **Hypothesis (mechanistic)** | At fixed context, higher char_density → longer time_to_failure (denser char = lower conductivity + better integrity). |
| **NOT claimed** | That this is a verified law, that it transfers across substrates/burn profiles, or that char_density is the *only* controlling axis. One series proves nothing — the chain `char structure → char integrity → time_to_failure` remains a hypothesis. |

## 2. The chain under test

```
Char Density  →  Char Integrity  →  Time To Failure
```

We measure both ends (char_density, time_to_failure) and the middle proxy
(char integrity, visual rating acceptable in the first pass) so a break in the chain is
visible, not hidden.

## 3. Hold CONSTANT (capture wide, record all)

- initial film thickness
- burn profile
- substrate
- sample age
- **base formulation** (the chemistry backbone)

All locked values recorded per observation as `conditions` (the contract enforces the
four `required_conditions` of char_density: `initial_film_thickness`, `exposed_area`,
`burn_profile`, `sample_age`). Lock list: `[LAB TO CONFIRM]`.

## 4. VARY — one component per series

Change **exactly one** formulation component across a series (e.g. PER level, or APP
level, or nanoclay), everything else fixed. One variable per series → any change in
char_density / time_to_failure is attributable. `[LAB TO CONFIRM which component first]`.

## 5. MEASURE (every panel)

| Axis | Unit | Method | Notes |
|---|---|---|---|
| Char Height | cm | ruler | primary component of volume |
| **Char Density** | kg/m³ | `char_mass_over_volume` | **follow the fixed measurement_protocol** (below) |
| Char Integrity | rating (ordinal) | visual inspection | visual acceptable in phase 1 |
| Time To Failure | min | heat to 500 °C, count minutes | the project protocol, NOT EN 13381-8 |

### char_density measurement_protocol (fixed — same protocol or values diverge)
1. Burn complete (per the recorded burn_profile)
2. Cool to room temperature
3. Remove loose ash (non-structural)
4. Weigh remaining char (mass)
5. Measure char volume (height × exposed_area, or displacement)
6. Density = mass / volume (kg/m³)

## 6. Promotion criterion (the only way C16 becomes Verified)

Upgrade **C16 `Mechanistic Hypothesis` → `Verified`** only if:

- a **consistent, monotonic** char_density → time_to_failure relationship appears, **and**
- it holds across **multiple base formulations** (not one series), **and**
- it survives at fixed context (the §3 locks held, recorded).

If it holds in one series but breaks in another → C16 stays Mechanistic; the breaking
formulation becomes the next question (a hidden co-factor — exactly what the contradiction
engine is for).

## 7. Why this matters

If E-012 confirms the relationship, MATRIYA gains **one of its first quantitative laws in
intumescent coatings, grounded in lab data — not theory.** It is also the first full pass
through the new inference layer:

```
Observation  →  Mechanistic Coupling (C16)  →  Boundary (deriveBoundary)  →  Decision
```

— the move from *recording* observations to *inferring* from them.
