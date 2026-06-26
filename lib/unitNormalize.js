/**
 * Unit Normalizer — converts a captured value/unit to the canonical unit so specs and
 * observations stay commensurable (Fresco: "נדרש Normalization"). Keeps the raw form for
 * traceability. Pure / no I/O.
 *
 * factor: canonical = raw * factor. Unknown units pass through with normalized=false.
 */
const CONV = {
  'g/cm3': { canonical: 'kg/m3', factor: 1000 },
  'kg/m3': { canonical: 'kg/m3', factor: 1 },
  'cp':    { canonical: 'mPa.s', factor: 1 },   // 1 cP = 1 mPa.s
  'mpa.s': { canonical: 'mPa.s', factor: 1 },
  'ph':    { canonical: 'pH', factor: 1 },
  '%':     { canonical: '%', factor: 1 },
  'min':   { canonical: 'min', factor: 1 },
  'micron':{ canonical: 'micron', factor: 1 },
  'mm':    { canonical: 'mm', factor: 1 },
  'mpa':   { canonical: 'MPa', factor: 1 },
};
const key = (u) => String(u == null ? '' : u).trim().toLowerCase();

export function normalize(value, unit) {
  const c = CONV[key(unit)];
  if (!Number.isFinite(value)) return { raw: `${value} ${unit}`, value, unit, normalized: false };
  if (!c) return { raw: `${value} ${unit}`, value, unit, normalized: false };
  return { raw: `${value} ${unit}`, value: value * c.factor, unit: c.canonical, normalized: true };
}

/** Normalize a [min,max] range; returns {raw, canonical:{min,max,unit}, normalized}. */
export function normalizeRange(min, max, unit) {
  const lo = normalize(min, unit), hi = normalize(max, unit);
  return {
    raw: `${min}-${max} ${unit}`,
    canonical: { min: lo.value, max: hi.value, unit: lo.unit },
    normalized: lo.normalized && hi.normalized,
  };
}

export default { normalize, normalizeRange };
