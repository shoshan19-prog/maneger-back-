/**
 * Document Capability Map — what each document TYPE can and cannot contain. The last layer
 * of K (Fresco): it lets the Gap List tell a real Missing from a false one. A Formula Sheet
 * that lacks compressive strength is not "missing" it — that data simply lives in a Product
 * Spec / QC Sheet. Turns a Spec Library into a Document Knowledge Model. Pure / no I/O.
 */
export const CAPABILITY = {
  'Formula Sheet': {
    can_contain: ['ingredients', 'ph', 'density', 'wet_viscosity', 'uniformity', 'consistency', 'whiteness', 'applicability', 'packing_weight'],
    should_not_contain: ['compressive_strength', 'flexural_strength', 'pull_off_adhesion', 'water_absorption_pct', 'fire_classification'],
  },
  'Product Specification': {
    can_contain: ['ph', 'density', 'wet_viscosity', 'compressive_strength', 'flexural_strength', 'pull_off_adhesion', 'water_absorption_pct', 'fire_classification'],
    should_not_contain: ['ingredients'],
  },
  'QC Sheet': {
    can_contain: ['ph', 'density', 'wet_viscosity', 'compressive_strength', 'pull_off_adhesion', 'uniformity', 'consistency'],
    should_not_contain: ['ingredients'],
  },
  'Test Report': {
    can_contain: ['results', 'compressive_strength', 'flexural_strength', 'pull_off_adhesion', 'water_absorption_pct', 'fire_classification'],
    should_not_contain: ['ingredients'],
  },
  'SOP': { can_contain: ['procedure'], should_not_contain: ['ph', 'density', 'compressive_strength'] },
  'Unknown': { can_contain: [], should_not_contain: [] },
};

export const capabilityOf = (docType) => CAPABILITY[docType] || CAPABILITY.Unknown;

/** Per (doc type, axis): is an absence a real gap, a non-issue, or undecidable? */
export function gapStatus(docType, axis) {
  const c = capabilityOf(docType);
  if (c.should_not_contain.includes(axis)) return 'Not Expected'; // route elsewhere — false gap avoided
  if (c.can_contain.includes(axis)) return 'Missing';             // doc could hold it but didn't → real gap
  return 'Unknown';                                               // capability silent
}

/** Which document types are the right home for an axis (for routing Not-Expected items). */
export function routesFor(axis) {
  return Object.entries(CAPABILITY)
    .filter(([, c]) => c.can_contain.includes(axis))
    .map(([dt]) => dt);
}

export default { CAPABILITY, capabilityOf, gapStatus, routesFor };
