/**
 * Parameter Dictionary — maps every label the lab writes (Hebrew / English / trade) to a
 * canonical axis, its kind (numeric|qualitative), source/canonical unit and method.
 * Single place to teach the system a new synonym (Fresco: Parameter Dictionary). Pure.
 */
export const PARAMETERS = [
  { axis: 'ph', kind: 'numeric', source_unit: 'pH', canonical_unit: 'pH', method: 'pH_meter_direct',
    aliases: ['ph', 'pH', 'הגבה', 'חומציות'] },
  { axis: 'density', kind: 'numeric', source_unit: 'g/cm3', canonical_unit: 'kg/m3', method: 'specific_gravity',
    aliases: ['משקל סגולי', 'density', 'specific gravity', 'sg', 'צפיפות'] },
  { axis: 'wet_viscosity', kind: 'numeric', source_unit: 'cP', canonical_unit: 'mPa.s', method: 'rotational_viscosity_profile',
    aliases: ['צמיגות', 'viscosity', 'viscosity profile'] },
  { axis: 'compressive_strength', kind: 'numeric', source_unit: 'MPa', canonical_unit: 'MPa', method: 'compressive_strength_timed',
    aliases: ['חוזק לחיצה', 'compressive strength', 'compression'] },
  // qualitative checks present in QC blocks but with no numeric scale yet (spec-axis backlog)
  { axis: 'uniformity', kind: 'qualitative', aliases: ['אחידות', 'uniformity'] },
  { axis: 'consistency', kind: 'qualitative', aliases: ['סמיכות', 'consistency'] },
  { axis: 'whiteness', kind: 'qualitative', aliases: ['לובן', 'whiteness'] },
  { axis: 'applicability', kind: 'qualitative', aliases: ['ישום', 'application', 'workability'] },
  { axis: 'packing_weight', kind: 'qualitative', aliases: ['משקל לאריזה', 'packing weight'] },
];

/** Find the parameter whose alias appears in `label` (longest alias wins). */
export function lookup(label) {
  const s = String(label || '').toLowerCase();
  let best = null;
  for (const p of PARAMETERS) {
    for (const a of p.aliases) {
      if (s.includes(a.toLowerCase()) && (!best || a.length > best.matchLen)) best = { ...p, matchLen: a.length };
    }
  }
  return best;
}

export const NUMERIC = PARAMETERS.filter(p => p.kind === 'numeric');
export const QUALITATIVE = PARAMETERS.filter(p => p.kind === 'qualitative');

export default { PARAMETERS, lookup, NUMERIC, QUALITATIVE };
