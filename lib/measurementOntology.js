/**
 * Measurement Ontology — classifies each canonical axis along the dimensions that let
 * MATRIYA reason about measurements, not just store key/values (Fresco):
 *   domain · lifecycle · phase · standard · measurement_type (+ age where time-dependent).
 *
 * This is what turns a Spec Library into a Materials Knowledge Layer — enabling queries like
 * "all chemical QC of the plaster family" or "products with no mechanical spec at all".
 * Pure / no I/O.
 */
// decision_level (Fresco): at which point in the chain the variable governs a decision —
// Incoming Material | Production | Product Validation | Certification.
export const ONTOLOGY = {
  ph: { domain: 'Chemical', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'non-destructive', variable_class: 'process', on_deviation: 'adjust_retest_release', decision_level: 'Production' },
  density: { domain: 'Physical', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'non-destructive', variable_class: 'process', on_deviation: 'adjust_retest_release', decision_level: 'Production' },
  wet_viscosity: { domain: 'Rheological', lifecycle: 'Production', phase: 'Wet', standard: 'ASTM D2196 / ISO 2555', measurement_type: 'non-destructive', variable_class: 'process', on_deviation: 'adjust_retest_release', decision_level: 'Production' },
  compressive_strength: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-11', measurement_type: 'destructive', age: '7/14/28 days', decision_level: 'Product Validation' },
  flexural_strength: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-11', measurement_type: 'destructive', decision_level: 'Product Validation' },
  water_absorption_pct: { domain: 'Durability', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1015-18', measurement_type: 'non-destructive', decision_level: 'Product Validation' },
  pull_off_adhesion: { domain: 'Mechanical', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 1542', measurement_type: 'semi-destructive', decision_level: 'Product Validation' },
  whiteness: { domain: 'Optical', lifecycle: 'Laboratory', phase: 'Dry film', standard: 'spectrophotometer / hiding chart', measurement_type: 'non-destructive', decision_level: 'Production' },
  fire_classification: { domain: 'Fire', lifecycle: 'Laboratory', phase: 'Hardened', standard: 'EN 13501-1', measurement_type: 'classification', decision_level: 'Certification' },
  uniformity: { domain: 'Application', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'qualitative', decision_level: 'Production' },
  consistency: { domain: 'Rheological', lifecycle: 'Production', phase: 'Wet', standard: 'Internal QC', measurement_type: 'qualitative', decision_level: 'Production' },
  applicability: { domain: 'Application', lifecycle: 'Laboratory', phase: 'Applied', standard: 'Internal QC', measurement_type: 'qualitative', decision_level: 'Production' },
  packing_weight: { domain: 'Logistics', lifecycle: 'Production', phase: 'n/a', standard: 'Internal QC', measurement_type: 'non-destructive', decision_level: 'Production' },
};

const UNMAPPED = { domain: 'unknown', lifecycle: 'unknown', phase: 'unknown', standard: 'unknown', measurement_type: 'unknown', _unmapped: true };

export function getClassification(axis) {
  return ONTOLOGY[axis] ? { ...ONTOLOGY[axis] } : { ...UNMAPPED };
}

export default { ONTOLOGY, getClassification };
