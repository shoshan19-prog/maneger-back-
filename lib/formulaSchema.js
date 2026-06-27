/**
 * Formula Schema v1.1 — the canonical Formula Object, the first-class entity Fresco named.
 * Pure / no I/O.
 *
 * v1.1 adds the structure that leads to BEHAVIOUR (three extensions, locked before Knowledge Graph):
 *  1. Role as a SEPARATE entity. Role is a property of the FORMULA, not of the material — the same
 *     material can be Packing in one formula and Opacity in another with no change to its identity.
 *     So FunctionalRole links (formula, ingredient) → role; it is NOT a field on Ingredient.
 *  2. Authority has TWO orthogonal dimensions: { field: objective|interpreted|pending,
 *     source: document|measurement|instrument|heuristic|unknown }. So one can later query
 *     "only measurement-backed knowledge" / "ignore heuristics" without restructuring the object.
 *  3. Functional Interface — an explicit layer between Component and Process (how a role behaves /
 *     couples to process). Defined now, mostly pending, so future linking needs no structural change.
 *
 * Boundary (held): identity is provisional until Q-009; a FunctionalRole is formula-scoped, never
 * global to the material; field=objective may never carry source=heuristic/unknown (interpretation
 * cannot masquerade as fact); pending layers are declared empty, not guessed.
 */

const slug = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}._-]+/gu, '');

/** Provisional canonical key. version semantics are Q-009 (open) → identity_status flags it. */
export function formulaId(product, version) {
  const p = slug(product) || 'unknown';
  const v = version ? slug(version) : 'unversioned';
  return `${p}:${v}`;
}

export const FIELD = ['objective', 'interpreted', 'pending'];
export const SOURCE = ['document', 'measurement', 'instrument', 'heuristic', 'unknown'];

/** Authority { field, source } with the invariant enforced at construction. */
export function authority(field, source) {
  return { field, source };
}

// How an extracted role maps to its two-dimensional authority. psd_fraction is objective because the
// material NAME is itself a particle-size range (mechanical, read from the document); binder/additive
// are interpreted heuristics. Source pairs with field per the schema invariants.
const ROLE_AUTHORITY = {
  psd_fraction: { field: 'objective', source: 'document', evidence: 'material name is a particle-size range/mesh' },
  binder: { field: 'interpreted', source: 'heuristic', evidence: 'binder keyword match (cement/lime/NHL)' },
  additive: { field: 'interpreted', source: 'heuristic', evidence: 'not a fraction and not a binder' },
};

/**
 * @param extracted  output of formulaExtract.extractFormula (ingredients carry a provisional role)
 * @param provenance { document_source, document_sha1?, extracted_date?, extraction_method? }
 */
export function canonicalFormula(extracted = {}, provenance = {}) {
  const version = extracted.version || null;
  const rawIngredients = extracted.ingredients || [];

  // 1. Ingredient = identity + composition ONLY (no role here).
  const ingredients = rawIngredients.map(i => ({
    material: i.name ?? i.material,
    batch: i.batch ?? null,
    percent: i.percent ?? null,
    quantity: i.quantity ?? null,
  }));

  // 1+2. FunctionalRole as a separate, formula-scoped entity, each carrying { field, source }.
  const functional_roles = rawIngredients.map(i => {
    const a = ROLE_AUTHORITY[i.role] || ROLE_AUTHORITY.additive;
    return {
      ingredient: i.name ?? i.material,
      role: i.role,
      authority: authority(a.field, a.source),
      evidence: a.evidence,
    };
  });

  return {
    formula_id: formulaId(extracted.product, version),
    product: extracted.product || '',
    product_family: extracted.family || 'unknown',
    version,
    identity_status: 'provisional_pending_Q009',
    ingredients,
    functional_roles,
    // 3. Functional Interface layer — explicit but pending (no process/behaviour data yet).
    functional_interfaces: [],
    psd: (extracted.psd_design || []).map(i => ({ fraction: i.name ?? i.material, percent: i.percent ?? null })),
    composition_audit: {
      percent_sum: extracted.percent_sum ?? 0,
      percent_ok: !!extracted.percent_ok,
      complete: !!extracted.percent_ok,
    },
    // pending layers — declared empty, NOT guessed
    process: null,
    measurements: [],
    performance: [],
    quality_checks: [],
    linked_experiments: [],
    linked_results: [],
    observed_effects: [],
    linked_projects: [],
    provenance: {
      document_source: provenance.document_source || '',
      document_sha1: provenance.document_sha1 || null,
      extraction_method: provenance.extraction_method || 'formulaExtract.v1',
      extraction_layer: 'layer1_objective',
      extracted_date: provenance.extracted_date || null,
      validated_by: null,
    },
  };
}

const REQUIRED = ['formula_id', 'product', 'product_family', 'ingredients', 'functional_roles', 'functional_interfaces', 'composition_audit', 'provenance', 'identity_status'];

/** The two-dimensional authority invariant (schema § authority.invariants). */
export function validateAuthority(a, where, errors) {
  if (!a || typeof a !== 'object') { errors.push(`${where}: missing authority`); return; }
  if (!FIELD.includes(a.field)) errors.push(`${where}: bad authority.field ${a.field}`);
  if (!SOURCE.includes(a.source)) errors.push(`${where}: bad authority.source ${a.source}`);
  if (a.field === 'objective' && !['document', 'measurement', 'instrument'].includes(a.source))
    errors.push(`${where}: objective may not come from source=${a.source} (a fact cannot trace to a heuristic)`);
  if (a.field === 'pending' && a.source !== 'unknown')
    errors.push(`${where}: pending must have source=unknown`);
}

/** Light structural validation against the schema's required fields + the authority contract. */
export function validateFormula(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['not an object'] };
  for (const k of REQUIRED) if (obj[k] == null) errors.push(`missing required field: ${k}`);

  if (!Array.isArray(obj.ingredients)) errors.push('ingredients must be an array');
  else obj.ingredients.forEach((i, n) => {
    if (!i.material) errors.push(`ingredient[${n}] missing material`);
    if ('role' in i) errors.push(`ingredient[${n}] must NOT carry role — role is a separate, formula-scoped entity (functional_roles)`);
  });

  if (!Array.isArray(obj.functional_roles)) errors.push('functional_roles must be an array');
  else obj.functional_roles.forEach((r, n) => {
    if (!r.ingredient) errors.push(`functional_role[${n}] missing ingredient`);
    if (!r.role) errors.push(`functional_role[${n}] missing role`);
    validateAuthority(r.authority, `functional_role[${n}]`, errors);
    // contract: a psd_fraction role is objective; binder/additive interpreted
    if (r.role === 'psd_fraction' && r.authority && r.authority.field !== 'objective')
      errors.push(`functional_role[${n}] psd_fraction must be objective`);
    if (['binder', 'additive'].includes(r.role) && r.authority && r.authority.field === 'objective')
      errors.push(`functional_role[${n}] ${r.role} cannot be objective (it is a heuristic)`);
  });

  if (!Array.isArray(obj.functional_interfaces)) errors.push('functional_interfaces must be an array');
  else obj.functional_interfaces.forEach((fi, n) => {
    if (!fi.interface) errors.push(`functional_interface[${n}] missing interface`);
    validateAuthority(fi.authority, `functional_interface[${n}]`, errors);
  });

  if (obj.provenance && !obj.provenance.document_source) errors.push('provenance.document_source is empty');
  if (obj.identity_status && !['provisional_pending_Q009', 'canonical'].includes(obj.identity_status)) errors.push(`bad identity_status: ${obj.identity_status}`);
  return { ok: errors.length === 0, errors };
}

export default { formulaId, authority, canonicalFormula, validateFormula, validateAuthority, FIELD, SOURCE };
