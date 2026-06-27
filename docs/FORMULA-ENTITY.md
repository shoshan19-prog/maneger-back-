# Formula as a First-Class Entity (Formula Schema v1.1)

> Born from the formula-extraction finding (Fresco). The significant result was not the 48
> ingredients — it was realizing the system must treat **Formula as a first-class entity**, not
> as a by-product of document parsing. **v1.1** adds the structure that leads to *behaviour*, not
> just the list of ingredients — locked BEFORE the Knowledge Graph (Fresco).

## v1.1 — three extensions (the structure that leads to behaviour)

**1. Role is a separate entity — not a field of Ingredient.**
Role is a property of the **formula**, not of the material. The same material can serve different
roles in different formulas with no change to its identity:
```
CaCO3  (Omyacarb 5)  is NOT always "Filler" — it may be:
   PSD controller · rheology stabilizer · cost optimizer · thermal sink · packing modifier
F-103:  Omyacarb 5 → role = Packing
F-200:  Omyacarb 5 → role = Opacity      (identical material, different role)
```
So `ingredients[]` carry **identity + composition only**; a separate `functional_roles[]` entity
links `(formula, ingredient) → role`. `validateFormula` rejects any `role` placed on an ingredient.

**2. Source Authority — orthogonal to Field Authority.**
Authority now has **two** dimensions per datum:
```
field  : objective | interpreted | pending     (is it fact, interpretation, or gap?)
source : document | measurement | instrument | heuristic | unknown   (where did it come from?)
```
Enforced invariants (in `validateAuthority`): `objective ⇒ source ∈ {document, measurement,
instrument}` (a fact may never trace to a heuristic); `pending ⇒ source = unknown`. This lets future
queries say *"show only measurement-backed knowledge"* or *"ignore all heuristics"* with no change to
the object structure.

**3. Functional Interface — an explicit layer between Component and Process.**
```
Formula → Functional Role → Component → PSD → Functional Interface → Process → Measurements → Performance
```
`functional_interfaces[]` is defined now (mostly **pending** — no process/behaviour data yet) so that
linking formulas, experiments, equipment and results later needs no structural change.

## The architecture shift

What the system assumed:
```
Document → Specifications
```
What Fresco's knowledge actually looks like:
```
Formula → Ingredients → Role → PSD → Process → Measurements → Performance
```

So the central knowledge layer is reordered:
```
Document
   ↓
Formula Extraction            (lib/formulaExtract.js)
   ↓
Canonical Formula Object      (lib/formulaSchema.js · config/formula_schema_v1.json)   ← v1, here
   ↓
Knowledge Graph               (LATER)
   ↓
Experiment Linking            (LATER)
   ↓
Project Knowledge             (LATER)
```
Spec extraction is not removed — it stays for documents that genuinely ARE spec sheets. But for
formula sheets, the Canonical Formula Object is the knowledge object the lab reasons about.

**Discipline (Fresco):** only the schema is defined now. Knowledge Graph / Experiment / Project
linking are deliberately NOT built until this schema is stable.

## What a Canonical Formula Object holds (v1.1)
`formula_id · product · product_family · version · identity_status · ingredients[] (identity+
composition) · functional_roles[] (role as entity) · functional_interfaces[] (explicit layer) ·
psd[] · composition_audit · process · measurements · performance · quality_checks ·
linked_experiments · linked_results · observed_effects · linked_projects · provenance`

It lets the lab eventually ask: *which formulas share a PSD? which ingredients always co-occur?
which experiments ran on each version? what changed between V4 and V5?* — questions a DOCX can't
answer.

## The Verified / Interpretation boundary (built INTO the schema)
Every field has a default authority in `config/formula_schema_v1.json → field_authority`, and every
authored datum (`functional_roles`, `functional_interfaces`) carries its own `{ field, source }`:

| field | meaning | examples |
|---|---|---|
| **objective** | read mechanically — authoritative | material, batch, percent, quantity, `psd` (name IS a size range) |
| **interpreted** | provisional heuristic — NOT asserted knowledge | `product_family`, functional roles (binder/additive) |
| **pending** | not in a formula sheet; awaits another source | `process`, `functional_interfaces`, `measurements`, `linked_*` |

Enforced in code (`validateFormula` / `validateAuthority`): a `psd_fraction` role must be objective;
a binder/additive role may not be objective; `objective` may never carry `source=heuristic/unknown`;
`pending` must be `source=unknown`. Interpretation cannot masquerade as fact.

Pending layers are declared **empty, not guessed** — an empty `process` / `functional_interfaces` is
a known gap, not a value.

## Identity is provisional (Law 2)
`formula_id` is `slug(product):slug(version)` with `identity_status: provisional_pending_Q009`.
What change creates a NEW formula identity (a new Premix? a new PSD design? same id?) is **Q-009**,
open for David. Until answered, do **not** aggregate across `formula_id` as if it were canonical
(*Identity Before Aggregation*).

## Maps to David
Formula = **Chemical System** (binders) + **PSD Design** (psd) + **Functional Premix** (additives)
+ **Manufacturing Strategy** (process — pending). Verified scope: B-4 + Dry Powder.

## Where it lives
- `config/formula_schema_v1.json` — the stable schema: principle, architecture shift, field
  authority, boundary, JSON Schema.
- `lib/formulaSchema.js` — `canonicalFormula()`, `validateFormula()`, `formulaId()`. Pure.
- `lib/formulaExtract.js` — the row-fact extractor it builds on.
- `tests/formulaSchema.test.mjs`, `tests/formulaExtract.test.mjs`.
- `scripts/extract_formulas.mjs` (`npm run formulas`) → `.corpus/formulas_v1.json` (proprietary,
  git-ignored); 8/8 valid against the schema.

## Next (only after the schema is stable)
1. Confirm the schema with Fresco/David; answer Q-009 to make `formula_id` canonical.
2. Then — and only then — Knowledge Graph nodes (Formula, Ingredient, PSD), Experiment linking,
   Project linking.
