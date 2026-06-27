/**
 * Knowledge Δ Engine — measures CHANGE in knowledge, not another entity/relationship (Fresco).
 * The Knowledge Graph answers "what exists / shared / changed". This answers the R&D question the
 * graph cannot: "what did we LEARN?" Every change is classified by the TYPE of knowledge added, so
 * an experiment earns a value = how much it moved knowledge, not just which formula it links to.
 * Pure / no I/O.
 *
 * Five Δ types:
 *   1. Identity Δ      — a new identity appeared (formula / material)
 *   2. Composition Δ   — an ingredient was added / removed / re-proportioned
 *   3. Authority Δ     — a datum MATURED: pending → interpreted → objective(document) →
 *                        objective(measurement). THE most important — knowledge becoming more
 *                        authoritative without changing what it is about.
 *   4. Boundary Δ      — a new boundary was born (e.g. "PSD 0.8-1.4 works only below APP 24%")
 *   5. Evidence Δ      — how many evidence items were added (+3 pull-off, +2 viscosity, ...)
 *
 * Fits MATRIYA's methodology: a law is born after the KNOWLEDGE STATE changes (K→C→B→N→L), not
 * merely because an experiment ran. Knowledge Δ is what makes that change measurable.
 */

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

// Authority maturity ladder — a single ordinal over the two-dimensional authority, so a maturation
// is a +1 step: pending < interpreted < objective(document) < objective(measurement) < objective(instrument).
export function authorityMaturity(a = {}) {
  if (a.field === 'pending') return 0;
  if (a.field === 'interpreted') return 1;
  if (a.field === 'objective') {
    if (a.source === 'instrument') return 4;
    if (a.source === 'measurement') return 3;
    return 2; // document (or unspecified objective source)
  }
  return 0;
}

const isMeasurementBacked = (a = {}) => a.source === 'measurement' || a.source === 'instrument';

/**
 * Build a comparable knowledge STATE from canonical formulas (+ optional boundaries / evidence).
 * @param formulas    canonical Formula Objects (Schema v1.1)
 * @param extras      { boundaries: [{id, statement}], evidence: { <axis>: count } }
 */
export function buildState(formulas = [], extras = {}) {
  const formula_ids = new Set();
  const materials = new Set();
  const composition = new Map();   // formula_id → Map(material → percent)
  const authority = new Map();     // key (formula|material) → { field, source }
  for (const f of formulas) {
    formula_ids.add(f.formula_id);
    const ing = new Map();
    for (const i of f.ingredients || []) { materials.add(norm(i.material)); ing.set(norm(i.material), i.percent ?? null); }
    composition.set(f.formula_id, ing);
    for (const r of f.functional_roles || []) {
      const key = `${f.formula_id}|${norm(r.ingredient)}`;
      const prev = authority.get(key);
      // if an ingredient carries multiple roles, keep the most mature authority
      if (!prev || authorityMaturity(r.authority) > authorityMaturity(prev)) authority.set(key, r.authority || { field: 'interpreted', source: 'heuristic' });
    }
  }
  const boundaries = new Map((extras.boundaries || []).map(b => [b.id || norm(b.statement), b]));
  const evidence = { ...(extras.evidence || {}) };
  return { formula_ids, materials, composition, authority, boundaries, evidence };
}

/** Fraction of authority datums that are measurement-backed (objective/measurement|instrument). */
export function measurementCoverage(state) {
  const items = [...state.authority.values()];
  if (!items.length) return 0;
  return Math.round(1000 * items.filter(isMeasurementBacked).length / items.length) / 10;
}

/**
 * Compute the classified Knowledge Δ from prev → curr knowledge state.
 * Returns the five Δ types + a summary including the measurement-coverage shift.
 */
export function computeDelta(prev, curr) {
  const setDiff = (a, b) => [...a].filter(x => !b.has(x));

  // 1. Identity Δ
  const new_formulas = setDiff(curr.formula_ids, prev.formula_ids);
  const new_materials = setDiff(curr.materials, prev.materials);

  // 2. Composition Δ — within formulas present in BOTH states (new formulas are identity Δ)
  const composition = { added: [], removed: [], percent_changed: [] };
  for (const [fid, cIng] of curr.composition) {
    const pIng = prev.composition.get(fid);
    if (!pIng) continue;
    for (const m of cIng.keys()) if (!pIng.has(m)) composition.added.push({ formula: fid, material: m });
    for (const m of pIng.keys()) if (!cIng.has(m)) composition.removed.push({ formula: fid, material: m });
    for (const [m, pct] of cIng) if (pIng.has(m) && pIng.get(m) !== pct) composition.percent_changed.push({ formula: fid, material: m, from: pIng.get(m), to: pct });
  }

  // 3. Authority Δ — datums present in BOTH whose maturity changed (the maturation of knowledge)
  const matured = [], regressed = [];
  for (const [key, ca] of curr.authority) {
    const pa = prev.authority.get(key);
    if (!pa) continue;
    const d = authorityMaturity(ca) - authorityMaturity(pa);
    if (d > 0) matured.push({ key, from: pa, to: ca });
    else if (d < 0) regressed.push({ key, from: pa, to: ca });
  }

  // 4. Boundary Δ
  const new_boundaries = [...curr.boundaries.keys()].filter(k => !prev.boundaries.has(k)).map(k => curr.boundaries.get(k));

  // 5. Evidence Δ
  const evidence_added = {}; let evidence_total = 0;
  for (const axis of new Set([...Object.keys(prev.evidence), ...Object.keys(curr.evidence)])) {
    const d = (curr.evidence[axis] || 0) - (prev.evidence[axis] || 0);
    if (d > 0) { evidence_added[axis] = d; evidence_total += d; }
  }

  const cov_from = measurementCoverage(prev), cov_to = measurementCoverage(curr);
  const counts = {
    identity: new_formulas.length + new_materials.length,
    composition: composition.added.length + composition.removed.length + composition.percent_changed.length,
    authority: matured.length + regressed.length,
    boundary: new_boundaries.length,
    evidence: evidence_total,
  };
  return {
    identity: { new_formulas, new_materials },
    composition,
    authority: { matured, regressed },
    boundary: { new: new_boundaries },
    evidence: { added: evidence_added, total: evidence_total },
    summary: {
      counts,
      total_changes: Object.values(counts).reduce((a, b) => a + b, 0),
      measurement_coverage_from: cov_from,
      measurement_coverage_to: cov_to,
      measurement_coverage_delta: Math.round((cov_to - cov_from) * 10) / 10,
      learned: counts.authority > 0 || counts.boundary > 0 || counts.evidence > 0, // maturation/boundary/evidence = real learning, beyond mere edits
    },
  };
}

export default { authorityMaturity, buildState, measurementCoverage, computeDelta };
