/**
 * Pre-experiment formulation rule-checker — operationalizes the composition-based
 * boundaries from intumescent_domain_pack.yaml (david@frescocolors.com) as a live gate.
 * Given a candidate formulation (component -> wt%), it flags which known boundaries it
 * violates BEFORE an experiment is run. This is the Boundary Registry guarding design.
 *
 * Only composition-checkable rules are here. Rules needing MEASURED properties
 * (expansion_adhesion_mismatch, thermal_activation_window) are reported as "needs
 * measurement" — they belong to deriveBoundary on observations, not to composition.
 *
 * Pure / no I/O. Resolves material names/aliases to canonical ids first (Law 2).
 */
import { resolveMaterial } from './aliasResolver.js';

// Component groups by canonical material_id (from the domain pack roles).
const G = {
  ACID: ['APP'],
  CARBON: ['PER', 'PHENOLIC_RESIN', 'EXPANDABLE_GRAPHITE', 'MELAMINE'],
  BINDER: ['LATEX', 'SILICATE', 'PHENOLIC_RESIN'],
  REINFORCEMENT: ['NANO_CLAY', 'GRAPHENE_OXIDE'],
  EXPANSION: ['EXPANDABLE_GRAPHITE', 'MELAMINE'],
};

const RULES = [
  { id: 'minimum_acid_catalysis', group: 'ACID', op: '>', threshold: 8.0, severity: 'critical',
    mechanism: 'inadequate_phosphoric_acid_for_char_network' },
  { id: 'carbon_char_balance', group: 'CARBON', op: '>', threshold: 5.0, severity: 'major',
    mechanism: 'insufficient_carbonaceous_char_network' },
  { id: 'binder_matrix_integrity', group: 'BINDER', op: '>', threshold: 10.0, severity: 'major',
    mechanism: 'insufficient_matrix_for_cohesion_and_adhesion' },
];

const cmp = (v, op, t) => (op === '>' ? v > t : op === '<' ? v < t : op === '>=' ? v >= t : v <= t);

/**
 * @param {Object} formulation  map of component (id/name/alias) -> amount (wt% or fraction)
 * @returns {{ ok:boolean, normalized:Object, checks:Array, needs_measurement:Array }}
 */
export function checkFormulation(formulation) {
  // resolve names -> canonical ids, summing duplicates
  const byId = {};
  for (const [name, amt] of Object.entries(formulation || {})) {
    const v = Number(amt);
    if (!Number.isFinite(v)) continue;
    const hit = resolveMaterial(name);
    const id = hit && !hit.ambiguous ? hit.material_id : String(name);
    byId[id] = (byId[id] || 0) + v;
  }
  // normalize to wt%: if the total looks like fractions (<= ~1.5), scale to percent
  const total = Object.values(byId).reduce((a, b) => a + b, 0);
  const scale = total > 0 && total <= 1.5 ? 100 : 1;
  const pct = Object.fromEntries(Object.entries(byId).map(([k, v]) => [k, v * scale]));

  const sumGroup = (g) => G[g].reduce((s, id) => s + (pct[id] || 0), 0);

  const checks = RULES.map(r => {
    const value = Number(sumGroup(r.group).toFixed(4));
    const pass = cmp(value, r.op, r.threshold);
    return { id: r.id, metric: `sum(${r.group})`, value, operator: r.op, threshold: r.threshold,
             pass, severity: r.severity, mechanism: r.mechanism };
  });

  // ratio rule: reinforcement / expansion > 0.5 (only if there is expansion)
  const exp = sumGroup('EXPANSION'), reinf = sumGroup('REINFORCEMENT');
  if (exp > 0) {
    const ratio = Number((reinf / exp).toFixed(4));
    checks.push({ id: 'expansion_reinforcement_coupling', metric: 'REINFORCEMENT/EXPANSION',
      value: ratio, operator: '>', threshold: 0.5, pass: ratio > 0.5, severity: 'warning',
      mechanism: 'unreinforced_high_expansion_leads_to_char_instability' });
  }

  return {
    ok: checks.every(c => c.pass),
    normalized_pct: pct,
    checks,
    needs_measurement: [
      { id: 'expansion_adhesion_mismatch', note: 'needs measured expansion_ratio & adhesion (use deriveBoundary)' },
      { id: 'thermal_activation_window', note: 'needs measured onset_temperature' },
    ],
  };
}

export default { checkFormulation };
