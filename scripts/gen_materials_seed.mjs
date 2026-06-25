import { MATERIALS } from '../lib/materialsSeed.js';
const esc = s => String(s).replace(/'/g, "''");
const rows = MATERIALS.map(m =>
  `  ('${esc(m.material_id)}', '${esc(m.material_name)}', '${esc(JSON.stringify(m.aliases))}'::jsonb, '${esc(m.material_family)}', '${esc(m.material_role)}', '${esc(m.technology_domain)}')`
).join(',\n');
const sql = `-- ============================================================================
-- 008 — Canonical materials + axes seed (intumescent)
-- GENERATED from lib/materialsSeed.js by scripts/gen_materials_seed.mjs — do not edit by hand.
-- Sources: intumescent_domain_pack.yaml (Drive) + trade names from the lab xlsx.
-- Run in MANAGEMENT system Supabase. Safe/additive (ON CONFLICT DO NOTHING).
-- ============================================================================

-- Canonical materials (resolves MEL/Melamine/Melafine, APP/EXOLIT, CHARMOR/PER, ...).
INSERT INTO materials (material_id, material_name, aliases, material_family, material_role, technology_domain) VALUES
${rows}
ON CONFLICT (material_id) DO NOTHING;

-- Additional canonical axes from the domain pack (scalar, with units).
INSERT INTO axes (axis_id, name, dimension, canonical_unit, method, is_scalar, noise_floor, outcome_spec) VALUES
  ('ADHESION', 'Adhesion strength', 'adhesion', 'MPa', 'pull_off_test', TRUE, NULL, NULL),
  ('CHAR_YIELD', 'Char yield', 'char_yield', '%', 'tga_residual_mass', TRUE, NULL, NULL),
  ('ONSET_TEMPERATURE', 'Intumescence onset temperature', 'onset_temperature', 'C', 'tga_dtg_onset', TRUE, NULL, NULL)
ON CONFLICT (axis_id) DO NOTHING;
`;
process.stdout.write(sql);
