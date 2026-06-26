/**
 * Measurement Ontology — classifies each canonical axis along the dimensions that let
 * MATRIYA reason about measurements, not just store key/values (Fresco):
 *   domain · lifecycle · phase · standard · measurement_type (+ age where time-dependent).
 *
 * This is what turns a Spec Library into a Materials Knowledge Layer — enabling queries like
 * "all chemical QC of the plaster family" or "products with no mechanical spec at all".
 * Pure / no I/O.
 */
export const ONTOLOGY = {
  ph: { domain: 'Chemical', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'non-destructive' },
  density: { domain: 'Physical', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'non-destructive' },
  wet_viscosity: { domain: 'Rheological', lifecycle: 'Production', phase: 'Wet', standard: 'ASTM D2196 / ISO 2555', measurement_type: 'non-destructive' },
  compressive_strength: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-11', measurement_type: 'destructive', age: '7/14/28 days' },
  flexural_strength: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-11', measurement_type: 'destructive' },
  water_absorption_pct: { domain: 'Durability', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-18', measurement_type: 'non-destructive' },
  pull_off_adhesion: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1542', measurement_type: 'semi-destructive' },
  whiteness: { domain: 'Optical', lifecycle: 'Laboratory', phase: 'Dry film', standard: 'spectrophotometer / hiding chart', measurement_type: 'non-destructive' },
  uniformity: { domain: 'Application', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'qualitative' },
  consistency: { domain: 'Rheological', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'qualitative' },
  applicability: { domain: 'Application', lifecycle: 'Laboratory', phase: 'Applied', standard: 'Internal QC', measurement_type: 'qualitative' },
  packing_weight: { domain: 'Logistics', lifecycle: 'Production', phase: 'n/a', standard: 'Internal QC', measurement_type: 'non-destructive' },
};

const UNMAPPED = { domain: 'unknown', lifecycle: 'unknown', phase: 'unknown', standard: 'unknown', measurement_type: 'unknown', _unmapped: true };

export function getClassification(axis) {
  return ONTOLOGY[axis] ? { ...ONTOLOGY[axis] } : { ...UNMAPPED };
}

export default { ONTOLOGY, getClassification };
