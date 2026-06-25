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

/**
 * Project coverage = equipment-coverage × what a project actually measures (Rachel's
 * registry). Surfaces the WORK GAP: axes the lab CAN measure and the project wants
 * (planned/missing) but isn't measuring yet.
 * @param {Array} properties property registry
 * @param {Array} equipment  equipment registry
 * @param {object} project    one project_test_registry entry ({done,planned,missing})
 * @returns {Array} [{axis, measurable, instruments, project_status, gap}]
 */
export function projectCoverage(properties, equipment, project) {
  const cov = Object.fromEntries(measurementCoverage(properties, equipment).map(c => [c.axis, c]));
  const statusOf = {};
  for (const k of ['done', 'planned', 'missing'])
    for (const t of (project?.[k] || [])) if (t.axis) statusOf[t.axis] = k;
  // union of registry axes + any property-registry axis referenced by the project
  const axisIds = new Set([...Object.keys(statusOf)]);
  return [...axisIds].map(axis => {
    const c = cov[axis] || { measurable: false, instruments: [] };
    const project_status = statusOf[axis];                 // done | planned | missing
    const gap = c.measurable && project_status !== 'done';  // can measure, project isn't (yet)
    return { axis, measurable: c.measurable, instruments: c.instruments, project_status, gap };
  }).sort((a, b) => Number(b.gap) - Number(a.gap));
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
