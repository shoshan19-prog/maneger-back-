/**
 * Measurement coverage — joins the Axis Authority (property registry) to the
 * Equipment Authority (lab equipment seed). Answers, per axis: CAN we measure it,
 * and with WHICH instrument? This is the commensurability/coverage layer: an axis
 * with no instrument is not yet observable here (a real coverage gap, not a guess).
 *
 * Join key: property.codebook (base code, parens stripped) vs equipment.measures[].
 * Pure / no I/O.
 */

const baseCode = (c) => (c == null ? '' : String(c).replace(/\(.*\)/, '').trim()); // 'FIRE_DRY(min)' -> 'FIRE_DRY'

/**
 * @param {Array} properties  property registry entries ({property_id, codebook, name, ...})
 * @param {Array} equipment   equipment entries ({name, measures:[codes], ...})
 * @returns {Array} [{ axis, name, codebook, measurable, instruments:[name] }]
 */
export function measurementCoverage(properties, equipment) {
  // index: codebook base code -> [instrument names]
  const byCode = {};
  for (const e of equipment || []) {
    for (const m of (e.measures || [])) {
      const k = baseCode(m);
      (byCode[k] ||= []).push(e.name);
    }
  }
  return (properties || []).map(p => {
    const code = baseCode(p.codebook);
    const instruments = code ? (byCode[code] || []) : [];
    return { axis: p.property_id, name: p.name, codebook: p.codebook || null,
             measurable: instruments.length > 0, instruments };
  });
}

/** Convenience summary. */
export function coverageSummary(properties, equipment) {
  const rows = measurementCoverage(properties, equipment);
  const measurable = rows.filter(r => r.measurable);
  return {
    total: rows.length,
    measurable: measurable.length,
    gaps: rows.filter(r => !r.measurable).map(r => r.axis),
  };
}

export default { measurementCoverage, coverageSummary };
