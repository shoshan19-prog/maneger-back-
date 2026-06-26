# N — The Observed-Property Principle (statement, not implementation)

> **FSCTM stage: N.** This document only *states the principle*. No SQL, no migration, no API,
> no schema. L (the law) and Design come only if this still feels right after reading it.

## 1. The problem that was solved
No single entity in the model can simultaneously and unambiguously own all five of:
**Value · Conditions · Uncertainty · Provenance · Authority.**
Because a value is **multi-valued** — it varies across conditions, method, time, and source —
"the value of property X of material M" has no single, well-defined answer. Therefore an
**Observed Property Identity** that carries one authoritative value **cannot be defined**.
This is a *structural* impossibility, not a missing feature.

## 2. The new principle
> **An Observed Property is not a value-bearing entity. It is a function derived from a set of
> measurement events. The event is the bearer of authority; the property is a derived result.**

- The **measurement event** is the atom of identity. It — and only it — owns Value + Conditions
  + Uncertainty + Provenance + Authority, all together, immutably, for that one event.
- The **property value** is never stored. It is *derived on demand* from the relevant set of
  events (a distribution, a boundary, a best estimate within a stated context).

## 3. Why A and B failed
- **A (promote an existing entity to the binding identity):** the promoted entity coexists with
  overlapping entities (measurements vs outcomes vs observations), so two different values for
  the same property can still exist. The impossibility is duplicated, not removed.
- **B (a new Observed-Property entity):** a property-level identity must still answer "the
  value" — but the value is multi-valued over conditions. Either two values coexist (fail), or
  conditions/method/time/provenance are folded into the key — at which point it has *become* an
  event store (C). B only relocates the impossibility.

## 4. Why C removes the impossibility
C makes the **event** the identity and the **property** a derivation:
- Each event is uniquely identified by its full content, so it has exactly one value — no two
  values compete for one identity.
- A property has **no stored value** to conflict; its value is a single derivation over events.
- All five attributes live, mandatory and together, on the immutable event.
The contradiction dissolves because nothing is asked to be both "one identity" and "many
values" at once. (This is the same shape as the existing **LAW-BOUNDARY-001** — *store
observations, derive boundaries* — generalized from boundaries to *every* observed property.)

## 5. What new capabilities this enables
- **Honest multiplicity:** disagreeing measurements coexist as facts (contradiction detection),
  instead of one overwriting another.
- **Context-scoped truth:** the same property yields different derived values for different
  contexts — explicitly, not by accident.
- **Full traceability / audit:** every derived value points back to the exact events behind it.
- **Uncertainty as first-class:** the derivation carries propagated uncertainty (T_noise).
- **Time-travel & re-derivation:** change the derivation method → re-derive history; the events
  never change.
- **Authority where it belongs:** on the event (who/how measured), not on a mutable "current value".

---
### Not yet (the next gates)
- **L (proposed, not ratified):** *"Property values are derived, not authoritative; authority
  belongs to the observation event."*
- **Design (later):** how an event is represented, how a property is derived, how traceability
  is kept.

If, after reading this, the principle still holds — only then move to L.
