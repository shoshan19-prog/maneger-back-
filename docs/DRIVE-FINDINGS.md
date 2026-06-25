# Relevant-data scan — findings (SharePoint requested → Google Drive used)

## Access reality
- **SharePoint is not reachable from here.** The integration uses Microsoft Graph with
  client-credential secrets (`SHAREPOINT_TENANT_ID/CLIENT_ID/CLIENT_SECRET`, server.js
  ~50, 3550–3812) that are not in this environment, and there is no SharePoint connector
  in the session. To mine SharePoint we'd need those secrets or an MS Graph connector.
- **Google Drive IS connected** and held directly relevant material, so I scanned it.

## What was found in Drive
| File | Owner | Relevance |
|---|---|---|
| `intumescent_domain_pack.yaml` | david@frescocolors.com | 🎯 **Goldmine** — see below |
| `INT‑TFX — תיק מוצר טכנולוגי` | shoshan19 | product/tech dossier (context) |
| `PR-TFX (Thermal-Flux +`, `שיקום בטון 2 פורמולציות` | shoshan19 | formulation docs (context) |
| `INTUMESCENT/` folder | shoshan19 | empty / no listable children |

## The domain pack is, in effect, a Boundary Registry already written
`intumescent_domain_pack.yaml` contains exactly the layers we've been building toward:

1. **Materials + aliases** (identity authority) — APP, expandable_graphite, melamine,
   PER, latex, phenolic_resin, nano_clay, graphene_oxide, silicate, each with aliases
   and roles. → seeded into `lib/materialsSeed.js` (merged with the lab xlsx trade names)
   and `migrations/008`.
2. **Property units** (axis authority) — expansion_ratio, adhesion (MPa), char_yield (%),
   onset_temperature (C), thickness (µm). → new axes ADHESION, CHAR_YIELD,
   ONSET_TEMPERATURE added in migration 008.
3. **Threshold rules = boundaries** — six quantified rules with thresholds, operators,
   failure modes and mechanisms. → captured in `docs/known-boundaries.seed.json` as
   calibration priors.
4. **Failure-mode taxonomy** — delamination, char_collapse, premature_activation,
   insufficient_expansion, char_cracking.
5. **Targets / DoE templates** — APP [8,25], expandable_graphite [0,8], latex [10,25].

## The key convergence
The pack's top rule — **`expansion_adhesion_mismatch`: expansion_ratio / adhesion < 28.5
→ delamination (critical)** — is the SAME boundary our empirical calibration found from
the burn-test xlsx (tall, low-density char detaches; competitors with denser char last
longer). Two independent sources — david's domain knowledge and Rachel's lab data —
point at the same boundary. That is strong corroboration, and a perfect first calibration
target: **does observed expansion/adhesion data place the boundary near 28.5?**

Note the pack also confirms the comfort-zone finding: it expects APP from 8 wt%, while the
lab data never went below ~24% — so APP-driven failures were never explored.

## What this unblocked (without Rachel, without SharePoint)
- `lib/materialsSeed.js` + `lib/aliasResolver.js` (+ tests) — material identity resolver
  (MEL/Melamine/Melafine → MELAMINE; EXOLIT → APP; CHARMOR → PER). This is the core of
  Phase A5, now buildable because the pack supplied canonical aliases.
- `migrations/008_materials_seed_intumescent.sql` — canonical materials + 3 new axes
  (generated from the seed; safe/additive; not yet run on the DB).
- `docs/known-boundaries.seed.json` — six prior boundaries for calibration.

## Caveat
The domain pack is v0.1, thresholds described as "learned from EIL data" — treat them as
**priors/hypotheses**, not ground truth. They seed calibration; observations refine them.
