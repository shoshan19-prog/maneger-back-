# L — LAW-AUTHORITY-001 · The Observation-Authority Law

> **FSCTM stage: L.** The principle from N (`docs/N-OBSERVED-PROPERTY-PRINCIPLE.md`), survived
> the survivability test and four analogies, is now stated as a law — about **Authority**, not
> about Property (that is where the K→C→B→N chain actually led). Still no Design, no schema, no code.

## Statement
> **Within the investigated observation domain, authority cannot be assigned to a stored
> observed value. Authority belongs to the observation record that binds value, conditions,
> uncertainty, provenance, and measurement context. Any property value is therefore a derived
> interpretation of authoritative observation records.**

The logic mirrors K→B→N: it begins with what was discovered (**authority**), explains *why*
(the five attributes bind to one record), and only then states the consequence (**property is
derived**).

## Principle (why it holds)
No single value-bearing entity can own value + conditions + uncertainty + provenance + authority
with a unique value, because the value is multi-valued over conditions/method/time/source. The
contradiction dissolves only when authority sits on the immutable **observation record** and the
property value is *derived* from the set of such records. (Generalizes the existing
**LAW-BOUNDARY-001** — store observations, derive boundaries — from boundaries to the class of
observed properties studied here.)

## Boundary of validity
This law is derived from the analysis of the current MATRIYA observation model. It holds only
for the **class of observed properties investigated in this analysis**. Its applicability beyond
this domain (e.g. decisions, mechanisms, engineering rules) is **not yet established** — see the
candidate generalization in N §8, which remains parked behind evidence.

## Falsifier
> **This law is falsified if an observed value can be shown to retain a unique and authoritative
> interpretation after being separated from its observation record while preserving measurement
> context, uncertainty, provenance, and authority.**

If such a case is exhibited, the law falls. That is what makes it a scientific law and not a
preference.

---
### Status & next gate
- **Ratified as L** for the observation domain (scope above).
- The wider claim — *authority is a property of the evidence, not of the object* — is **not**
  this law; it stays a candidate until confirmed in ≥2 further domains by observation.
- **Design comes next (not yet):** how an observation record is represented, how a property is
  derived, how traceability is preserved. No SQL/migration/API until Design is written.
