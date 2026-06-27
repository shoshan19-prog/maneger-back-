# Formula as a First-Class Entity (Formula Schema v1)

> Born from the formula-extraction finding (Fresco). The significant result was not the 48
> ingredients — it was realizing the system must treat **Formula as a first-class entity**, not
> as a by-product of document parsing.

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

## What a Canonical Formula Object holds
`formula_id · product · product_family · version · ingredients[] · psd[] · chemical_system ·
functional_additives · composition_audit · process · quality_checks · linked_experiments ·
linked_results · observed_effects · linked_projects · provenance`

It lets the lab eventually ask: *which formulas share a PSD? which ingredients always co-occur?
which experiments ran on each version? what changed between V4 and V5?* — questions a DOCX can't
answer.

## The Verified / Interpretation boundary (built INTO the schema)
Every field is tagged in `config/formula_schema_v1.json → field_authority`:

| authority | meaning | examples |
|---|---|---|
| **objective** | read mechanically from the document — authoritative | material, batch, percent, quantity, `psd` (name IS a size range), composition_audit |
| **interpreted** | provisional heuristic — NOT asserted knowledge | `product_family`, ingredient `role` (binder/additive), `chemical_system`, `functional_additives` |
| **pending** | not in a formula sheet; awaits another source | `process` (David/SOP), `linked_*`, `observed_effects` |

Enforced in code: `validateFormula()` rejects a formula that claims `role_authority: objective`
for anything other than a `psd_fraction`. Interpretation cannot masquerade as fact.

Pending fields are declared **empty, not guessed** — an empty `process` is a known gap, not a value.

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
