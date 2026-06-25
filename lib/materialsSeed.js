/**
 * Canonical materials seed for intumescent coatings — single source of truth for
 * material identity. Merges two real sources:
 *   1. intumescent_domain_pack.yaml (david@frescocolors.com) — canonical names,
 *      roles, families, and generic aliases.
 *   2. trade names observed in INTUMESCENT_NEW_FORMULATIONS_*.xlsx (the lab data).
 *
 * Used by lib/aliasResolver.js and to generate migrations/008 (scripts/gen_materials_seed.mjs).
 * This is what resolves MEL/Melamine/Melafine and APP/EXOLIT to ONE id each.
 */
export const MATERIALS = [
  { material_id: 'APP', material_name: 'Ammonium polyphosphate', material_family: 'phosphate',
    material_role: 'acid_source', technology_domain: 'intumescent',
    aliases: ['ammonium_polyphosphate', 'polyphosphate', 'ammonium_phosphate', 'EXOLIT AP435', 'EXOLIT AP423', 'AP435', 'AP423'] },
  { material_id: 'EXPANDABLE_GRAPHITE', material_name: 'Expandable graphite', material_family: 'carbon',
    material_role: 'blowing_agent', technology_domain: 'intumescent',
    aliases: ['EG', 'graphite', 'intercalated_graphite', 'expandable graphite'] },
  { material_id: 'MELAMINE', material_name: 'Melamine', material_family: 'nitrogen_source',
    material_role: 'blowing_agent', technology_domain: 'intumescent',
    aliases: ['MEL', 'melafine', 'MELAFINE', 'AFLAMMIT PMN200', 'melamine_powder', 'triazine'] },
  { material_id: 'PER', material_name: 'Pentaerythritol', material_family: 'polyol',
    material_role: 'carbon_source', technology_domain: 'intumescent',
    aliases: ['pentaerythritol', 'carbon_donor', 'PENTA', 'CHARMOR PM 40', 'CHARMOR PM40', 'CHARMOR DP15', 'CHARMOR'] },
  { material_id: 'LATEX', material_name: 'Acrylic latex binder', material_family: 'polymer',
    material_role: 'binder', technology_domain: 'intumescent',
    aliases: ['acrylic_latex', 'styrene_acrylic', 'polymer_binder', 'latex', 'ENCOR 367', 'ENCOR 2394', 'MOWILITH DM230'] },
  { material_id: 'PHENOLIC_RESIN', material_name: 'Phenolic resin', material_family: 'resin',
    material_role: 'carbon_source', technology_domain: 'intumescent',
    aliases: ['phenolic', 'resole', 'novolac', 'phenolic_resin'] },
  { material_id: 'NANO_CLAY', material_name: 'Nano clay', material_family: 'mineral',
    material_role: 'reinforcement', technology_domain: 'intumescent',
    aliases: ['montmorillonite', 'organoclay', 'nanoclay', 'nano_clay'] },
  { material_id: 'GRAPHENE_OXIDE', material_name: 'Graphene oxide', material_family: 'carbon',
    material_role: 'reinforcement', technology_domain: 'intumescent',
    aliases: ['GO', 'oxidized_graphene', 'graphene_oxide_sheets', 'graphene_oxide'] },
  { material_id: 'SILICATE', material_name: 'Alkali silicate', material_family: 'inorganic',
    material_role: 'binder', technology_domain: 'intumescent',
    aliases: ['potassium_silicate', 'sodium_silicate', 'alkali_silicate', 'silicate', 'COMBIZELL'] },
  { material_id: 'TIO2', material_name: 'Titanium dioxide', material_family: 'pigment',
    material_role: 'pigment', technology_domain: 'intumescent',
    aliases: ['TiO2', 'titanium_dioxide', 'TIONA 595', 'TIONA 826', 'KRONOS 2160'] },
  { material_id: 'XANTHAN', material_name: 'Xanthan gum', material_family: 'rheology',
    material_role: 'thickener', technology_domain: 'intumescent',
    aliases: ['xanthan', 'KELZAN AR', 'KELZAN'] },
  { material_id: 'ANTIFOAM', material_name: 'Antifoam agent', material_family: 'additive',
    material_role: 'antifoam', technology_domain: 'intumescent',
    aliases: ['AGITAN 80', 'TROYKYD D704', 'defoamer', 'anti_foam'] },
  { material_id: 'DISPERSANT', material_name: 'Dispersant', material_family: 'additive',
    material_role: 'dispersant', technology_domain: 'intumescent',
    aliases: ['OROTAN 731', 'OROTAN 1124', 'dispersant'] },
];

export default { MATERIALS };
