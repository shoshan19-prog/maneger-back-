/**
 * Spec extractor — pulls the QC acceptance block ("בדיקות") out of a Fresco formulation
 * sheet (text representation) into a Product Specification Library entry: the T_relevance
 * side of the decision boundary (when is a result "good"), per product.
 *
 * One source, used by scripts/extract_specs.mjs and its test. Pure / no I/O.
 *
 * Two template families seen in the lab:
 *   A. liquid products (WK-200 style) — numbered QC block with ranges (PH, משקל סגולי...).
 *   B. dry cementitious powders (FRESCO COLORS style) — formulation only, QC fields blank.
 * This extracts the numeric ranges where present and lists the qualitative checks as gaps.
 */

// Numeric QC axes → canonical axis + unit + method. `note` flags commensurability issues.
const NUMERIC_AXES = [
  { key: 'PH', axis: 'ph', unit: 'pH', method: 'pH_meter_direct' },
  { key: 'משקל סגולי', axis: 'density', unit: 'g/cm3', method: 'specific_gravity',
    note: 'captured in g/cm3; canonical axis "density" is kg/m3 — multiply by 1000 before aggregating' },
];

// Qualitative checks present in the block but with no numeric scale yet → spec-axis backlog.
const QUALITATIVE_AXES = [
  { keys: ['אחידות'], axis: 'uniformity' },
  { keys: ['סמיכות'], axis: 'consistency' },
  { keys: ['לובן'], axis: 'whiteness' },
  { keys: ['ישום'], axis: 'applicability' },
  { keys: ['משקל לאריזה'], axis: 'packing_weight' },
];

const numRange = (key, text) => {
  // key, then up to ~12 non-digit chars, then "a - b" (spaces optional around the dash)
  const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^\\d\\n]{0,12}([\\d.]+)\\s*-\\s*([\\d.]+)');
  const m = text.match(re);
  if (!m) return null;
  const min = Number(m[1]), max = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min: Math.min(min, max), max: Math.max(min, max) };
};

/** @returns {{product:string, specs:object[], declared_empty:string[], qualitative_gaps:string[]}} */
export function extractSpecs(text, fallbackName = '') {
  const nameM = text.match(/שם\s*מוצר[ ,]+([^,\n]+?)\s*(?:,|\n|$)/);
  const product = (nameM ? nameM[1] : fallbackName).trim();

  const specs = [];
  const declared_empty = [];
  for (const a of NUMERIC_AXES) {
    const present = text.includes(a.key);
    const r = numRange(a.key, text);
    if (r) specs.push({ axis: a.axis, min: r.min, max: r.max, unit: a.unit, method: a.method, ...(a.note ? { note: a.note } : {}) });
    else if (present) declared_empty.push(a.axis); // QC row exists but no range filled
  }

  const qualitative_gaps = [];
  for (const q of QUALITATIVE_AXES) {
    if (q.keys.some(k => text.includes(k))) qualitative_gaps.push(q.axis);
  }
  return { product, specs, declared_empty, qualitative_gaps };
}

export default { extractSpecs };
