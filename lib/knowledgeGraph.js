/**
 * Knowledge Graph (derived, in-memory) — the layer above Formula Schema v1.1. Pure / no I/O.
 *
 * Law 3 (store observations, derive boundaries): the graph is DERIVED from canonical Formula
 * Objects, never stored. graph(t) is recomputed from the formulas; there is no parallel persisted
 * truth to drift. No DB / migration here — only the derivation + the queries it unlocks.
 *
 * It is NOT `Formula ──contains── Ingredient`. It is the chemist's chain (Schema v1.1):
 *   Formula → Functional Role → Component → PSD → [Functional Interface → Process → Measurement →
 *   Performance]  (the tail is pending until process/measurement data exists).
 *
 * Every edge carries the two-dimensional authority { field, source } from the formula object, so a
 * caller can later take "only measurement-backed" or "no heuristics" SUBGRAPHS without restructure.
 *
 * Identity caveat: nodes keyed by formula_id are PROVISIONAL (Q-009 open); Component identity is
 * still fractured (Phase A5) → ingredient nodes dedupe by normalized name, marked provisional.
 */

const norm = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

const NODE = { FORMULA: 'Formula', COMPONENT: 'Component', ROLE: 'FunctionalRole', PSD: 'PSDFraction' };
const EDGE = {
  CONTAINS: 'contains',        // Formula → Component   (objective/document)
  HAS_ROLE: 'has_role',        // Formula → FunctionalRole (authority from the role)
  ASSIGNS: 'assigns',          // FunctionalRole → Component
  USES_PSD: 'uses_psd',        // Formula → PSDFraction (objective/document)
};

/** Build the derived graph from an array of canonical Formula Objects (Schema v1.1). */
export function buildGraph(formulas = []) {
  const nodes = new Map();
  const edges = [];
  const addNode = (id, type, props = {}) => { if (!nodes.has(id)) nodes.set(id, { id, type, ...props }); return id; };
  const addEdge = (from, to, type, authority, props = {}) => { edges.push({ from, to, type, authority, ...props }); };

  for (const f of formulas) {
    const fid = addNode(`F:${f.formula_id}`, NODE.FORMULA, { product: f.product, family: f.product_family, identity_status: f.identity_status, complete: f.composition_audit?.complete });
    for (const ing of f.ingredients || []) {
      const cid = addNode(`C:${norm(ing.material)}`, NODE.COMPONENT, { name: ing.material, identity: 'provisional' });
      addEdge(fid, cid, EDGE.CONTAINS, { field: 'objective', source: 'document' }, { percent: ing.percent });
    }
    for (const r of f.functional_roles || []) {
      const rid = addNode(`R:${f.formula_id}|${norm(r.ingredient)}|${r.role}`, NODE.ROLE, { role: r.role, ingredient: r.ingredient, formula: f.formula_id });
      addEdge(fid, rid, EDGE.HAS_ROLE, r.authority || { field: 'interpreted', source: 'heuristic' }, { evidence: r.evidence });
      addEdge(rid, `C:${norm(r.ingredient)}`, EDGE.ASSIGNS, r.authority || { field: 'interpreted', source: 'heuristic' });
    }
    for (const p of f.psd || []) {
      const pid = addNode(`P:${norm(p.fraction)}`, NODE.PSD, { fraction: p.fraction });
      addEdge(fid, pid, EDGE.USES_PSD, { field: 'objective', source: 'document' }, { percent: p.percent });
    }
  }
  return { nodes, edges, NODE, EDGE };
}

const edgesOf = (g, type) => g.edges.filter(e => e.type === type);

/** Which formulas share a PSD fraction? (groups of ≥2 formulas per fraction) */
export function formulasSharingPsd(g) {
  const byFraction = new Map();
  for (const e of edgesOf(g, EDGE.USES_PSD)) {
    const frac = g.nodes.get(e.to)?.fraction;
    if (!byFraction.has(frac)) byFraction.set(frac, new Set());
    byFraction.get(frac).add(g.nodes.get(e.from)?.product || e.from);
  }
  return [...byFraction.entries()]
    .map(([fraction, set]) => ({ fraction, formulas: [...set] }))
    .filter(x => x.formulas.length > 1)
    .sort((a, b) => b.formulas.length - a.formulas.length);
}

/** Which ingredients co-occur across formulas? (pairs, by count, count≥min) */
export function coOccurringIngredients(g, { min = 2 } = {}) {
  const perFormula = new Map(); // formulaNode → Set(componentName)
  for (const e of edgesOf(g, EDGE.CONTAINS)) {
    if (!perFormula.has(e.from)) perFormula.set(e.from, new Set());
    perFormula.get(e.from).add(g.nodes.get(e.to)?.name);
  }
  const pairCount = new Map();
  for (const set of perFormula.values()) {
    const arr = [...set].sort();
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const k = `${arr[i]} + ${arr[j]}`;
      pairCount.set(k, (pairCount.get(k) || 0) + 1);
    }
  }
  return [...pairCount.entries()].filter(([, c]) => c >= min).map(([pair, count]) => ({ pair, count })).sort((a, b) => b.count - a.count);
}

/** What roles does a material play across formulas? (the CaCO3 insight made queryable) */
export function rolesOfMaterial(g, material) {
  const key = norm(material);
  const roles = new Map(); // role → [formula]
  for (const n of g.nodes.values()) {
    if (n.type === NODE.ROLE && norm(n.ingredient) === key) {
      if (!roles.has(n.role)) roles.set(n.role, new Set());
      roles.get(n.role).add(n.formula);
    }
  }
  return [...roles.entries()].map(([role, set]) => ({ role, formulas: [...set] }));
}

/** Materials that play MORE THAN ONE distinct role across formulas (role is formula-scoped). */
export function materialsWithMultipleRoles(g) {
  const byMat = new Map(); // material → Set(role)
  for (const n of g.nodes.values()) {
    if (n.type !== NODE.ROLE) continue;
    const k = n.ingredient;
    if (!byMat.has(k)) byMat.set(k, new Set());
    byMat.get(k).add(n.role);
  }
  return [...byMat.entries()].filter(([, s]) => s.size > 1).map(([material, s]) => ({ material, roles: [...s] }));
}

/** Source-authority coverage over all edges — "how much knowledge is measurement-backed vs heuristic?" */
export function authorityCoverage(g) {
  const bySource = {}, byField = {};
  for (const e of g.edges) {
    const s = e.authority?.source || 'unknown', f = e.authority?.field || 'pending';
    bySource[s] = (bySource[s] || 0) + 1;
    byField[f] = (byField[f] || 0) + 1;
  }
  const total = g.edges.length || 1;
  const pct = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(1000 * v / total) / 10]));
  return { total: g.edges.length, by_source: bySource, by_field: byField, by_source_pct: pct(bySource), by_field_pct: pct(byField) };
}

/** Take the subgraph of edges whose authority matches a filter (e.g. {source:'measurement'}). */
export function subgraph(g, filter = {}) {
  const edges = g.edges.filter(e => Object.entries(filter).every(([k, v]) => (e.authority || {})[k] === v));
  const keep = new Set(edges.flatMap(e => [e.from, e.to]));
  const nodes = new Map([...g.nodes].filter(([id]) => keep.has(id)));
  return { nodes, edges, NODE: g.NODE, EDGE: g.EDGE };
}

/** What changed between two formula versions (V4 → V5)? Ingredients added/removed, percent + role shifts. */
export function diffFormulas(a, b) {
  const mapIng = (f) => new Map((f.ingredients || []).map(i => [norm(i.material), i]));
  const mapRole = (f) => new Map((f.functional_roles || []).map(r => [norm(r.ingredient), r.role]));
  const ia = mapIng(a), ib = mapIng(b), ra = mapRole(a), rb = mapRole(b);
  const added = [...ib.keys()].filter(k => !ia.has(k)).map(k => ib.get(k).material);
  const removed = [...ia.keys()].filter(k => !ib.has(k)).map(k => ia.get(k).material);
  const percent_changed = [...ib.keys()].filter(k => ia.has(k) && ia.get(k).percent !== ib.get(k).percent)
    .map(k => ({ material: ib.get(k).material, from: ia.get(k).percent, to: ib.get(k).percent }));
  const role_changed = [...rb.keys()].filter(k => ra.has(k) && ra.get(k) !== rb.get(k))
    .map(k => ({ material: ib.get(k)?.material || k, from: ra.get(k), to: rb.get(k) }));
  return { added, removed, percent_changed, role_changed, changed: !!(added.length || removed.length || percent_changed.length || role_changed.length) };
}

export default { buildGraph, formulasSharingPsd, coOccurringIngredients, rolesOfMaterial, materialsWithMultipleRoles, authorityCoverage, subgraph, diffFormulas };
