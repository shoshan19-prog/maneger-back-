# MATRIYA Knowledge Libraries — the 7th library: Engineering Playbook

A turning point (Fresco): today's operational knowledge from David is not just another
`knowledge_origin` tag — it is its own library. MATRIYA's knowledge now spans **seven** libraries.

## The seven libraries
```
1. Materials Library      — what things are made of (formulas, identities)
2. SOP Library            — how things are made/measured (procedures)
3. Requirement Library    — when a result is "good" (specs / T_relevance)
4. Experiment Library     — what was measured (runs, conditions, results)
5. Decision Library       — what was decided (release/hold/reject, decision_shift)
6. Knowledge Graph        — how it all connects (boundaries, couplings, mechanisms)
7. Engineering Playbook   — how Fresco THINKS (rules of engineering practice)   ← NEW
```
The Playbook (`config/engineering_playbook_v1.json`) is the hardest to build and the most
unique: it is not in any TDS, SOP, or standard — it exists only in the people who develop the
products. It answers *"show me Fresco's engineering rules,"* not *"show me documents."*

## Three kinds of knowledge (knowledge science / knowledge engineering)
| Kind | Question | Example | Lives in |
|---|---|---|---|
| **Declarative** | what is true | pH 7.6–10 | Requirement / Materials |
| **Procedural** | how to do it | the viscosity SOP | SOP |
| **Engineering** | why & when (rules of practice) | "PSD is not compensated by the formula" | **Engineering Playbook** |

## Engineering rule shape
Each Playbook entry is an `engineering_rule`:
```yaml
id: ENG-001
rule: "Identity variables are not compensated — reject the material, don't reformulate."
knowledge_type: engineering
source: David
derived_from: operational_practice
status: verified
scope: [Dry Powder, B-4 Primer]
falsifier: "a batch saved to spec purely by reformulating around an out-of-identity material"
```
The optional **falsifier** keeps even tacit rules Popperian — a rule you could, in principle,
disprove (consistent with how couplings/boundaries are governed).

## Current contents (v1, verified — David)
ENG-001 identity not compensated · ENG-002 PSD is part of the formula · ENG-003 Premix fixed,
no Batch ID · ENG-004 Incoming QC precedes production · ENG-005 dry-powder QC ≠ liquid QC ·
ENG-006 supplier CoA not final · ENG-007 deep investigation is event-driven · ENG-008 quality
before production · ENG-009 Formula ≠ Recipe.

Scope strictly **B-4 Primer + Dry Powder**; do not generalize.

## Why this is a major asset
It lets MATRIYA distinguish a *document*, an *experiment*, a *standard*, and the *accumulated
operational reasoning* of Fresco's experts — the layer that no competitor's corpus contains.
