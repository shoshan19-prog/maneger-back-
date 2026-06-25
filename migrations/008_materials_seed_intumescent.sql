-- ============================================================================
-- 008 — Canonical materials + axes seed (intumescent)
-- GENERATED from lib/materialsSeed.js by scripts/gen_materials_seed.mjs — do not edit by hand.
-- Sources: intumescent_domain_pack.yaml (Drive) + trade names from the lab xlsx.
-- Run in MANAGEMENT system Supabase. Safe/additive (ON CONFLICT DO NOTHING).
-- ============================================================================

-- Canonical materials (resolves MEL/Melamine/Melafine, APP/EXOLIT, CHARMOR/PER, ...).
INSERT INTO materials (material_id, material_name, aliases, material_family, material_role, technology_domain) VALUES
  ('APP', 'Ammonium polyphosphate', '["ammonium_polyphosphate","polyphosphate","ammonium_phosphate","EXOLIT AP435","EXOLIT AP423","AP435","AP423"]'::jsonb, 'phosphate', 'acid_source', 'intumescent'),
  ('EXPANDABLE_GRAPHITE', 'Expandable graphite', '["EG","graphite","intercalated_graphite","expandable graphite"]'::jsonb, 'carbon', 'blowing_agent', 'intumescent'),
  ('MELAMINE', 'Melamine', '["MEL","melafine","MELAFINE","AFLAMMIT PMN200","melamine_powder","triazine"]'::jsonb, 'nitrogen_source', 'blowing_agent', 'intumescent'),
  ('PER', 'Pentaerythritol', '["pentaerythritol","carbon_donor","PENTA","CHARMOR PM 40","CHARMOR PM40","CHARMOR DP15","CHARMOR"]'::jsonb, 'polyol', 'carbon_source', 'intumescent'),
  ('LATEX', 'Acrylic latex binder', '["acrylic_latex","styrene_acrylic","polymer_binder","latex","ENCOR 367","ENCOR 2394","MOWILITH DM230"]'::jsonb, 'polymer', 'binder', 'intumescent'),
  ('PHENOLIC_RESIN', 'Phenolic resin', '["phenolic","resole","novolac","phenolic_resin"]'::jsonb, 'resin', 'carbon_source', 'intumescent'),
  ('NANO_CLAY', 'Nano clay', '["montmorillonite","organoclay","nanoclay","nano_clay"]'::jsonb, 'mineral', 'reinforcement', 'intumescent'),
  ('GRAPHENE_OXIDE', 'Graphene oxide', '["GO","oxidized_graphene","graphene_oxide_sheets","graphene_oxide"]'::jsonb, 'carbon', 'reinforcement', 'intumescent'),
  ('SILICATE', 'Alkali silicate', '["potassium_silicate","sodium_silicate","alkali_silicate","silicate","COMBIZELL"]'::jsonb, 'inorganic', 'binder', 'intumescent'),
  ('TIO2', 'Titanium dioxide', '["TiO2","titanium_dioxide","TIONA 595","TIONA 826","KRONOS 2160"]'::jsonb, 'pigment', 'pigment', 'intumescent'),
  ('XANTHAN', 'Xanthan gum', '["xanthan","KELZAN AR","KELZAN"]'::jsonb, 'rheology', 'thickener', 'intumescent'),
  ('ANTIFOAM', 'Antifoam agent', '["AGITAN 80","TROYKYD D704","defoamer","anti_foam"]'::jsonb, 'additive', 'antifoam', 'intumescent'),
  ('DISPERSANT', 'Dispersant', '["OROTAN 731","OROTAN 1124","dispersant"]'::jsonb, 'additive', 'dispersant', 'intumescent')
ON CONFLICT (material_id) DO NOTHING;

-- Additional canonical axes from the domain pack (scalar, with units).
INSERT INTO axes (axis_id, name, dimension, canonical_unit, method, is_scalar, noise_floor, outcome_spec) VALUES
  ('ADHESION', 'Adhesion strength', 'adhesion', 'MPa', 'pull_off_test', TRUE, NULL, NULL),
  ('CHAR_YIELD', 'Char yield', 'char_yield', '%', 'tga_residual_mass', TRUE, NULL, NULL),
  ('ONSET_TEMPERATURE', 'Intumescence onset temperature', 'onset_temperature', 'C', 'tga_dtg_onset', TRUE, NULL, NULL)
ON CONFLICT (axis_id) DO NOTHING;
