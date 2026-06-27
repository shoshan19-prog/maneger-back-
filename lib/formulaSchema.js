/**
 * Formula Schema v1 — turns raw extraction (lib/formulaExtract.js) into a CANONICAL Formula
 * Object, the first-class entity Fresco named. Pure / no I/O.
 *
 * Two jobs:
 *   canonicalFormula(extracted, provenance) — map row facts → the stable schema, tagging each
 *     ingredient's role with role_authority (objective for psd_fraction, interpreted otherwise),
 *     and leaving pending fields (process / linked_* / observed_effects) EXPLICITLY EMPTY — a
 *     known gap, never a guess.
 *   validateFormula(obj) — light structural check against config/formula_schema_v1.json's required
 *     fields + the objective/interpreted contract. Returns { ok, errors }.
 *
 * Boundary (held): identity is PROVISIONAL until Q-009 (David) defines what change makes a new
 * formula. We do not aggregate across formula_id as canonical yet (Law 2: Identity Before
 * Aggregation). Only objective fields carry authority; interpreted roles are provisional.
 */

const slug = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}._-]+/gu, '');

/** Provisional canonical key. version semantics are Q-009 (open) → identity_status flags it. */
export function formulaId(product, version) {
  const p = slug(product) || 'unknown';
  const v = version ? slug(version) : 'unversioned';
  return `${p}:${v}`;
}

const ROLE_AUTHORITY = { psd_fraction: 'objective', binder: 'interpreted', additive: 'interpreted' };

/**
 * @param extracted  output of formulaExtract.extractFormula
 * @param provenance { document_source, document_sha1?, extracted_date?, extraction_method? }
 */
export function canonicalFormula(extracted = {}, provenance = {}) {
  const version = extracted.version || null;
  const ingredients = (extracted.ingredients || []).map(i => ({
    material: i.name ?? i.material,
    batch: i.batch ?? null,
    percent: i.percent ?? null,
    quantity: i.quantity ?? null,
    role: i.role,
    role_authority: ROLE_AUTHORITY[i.role] || 'interpreted',
  }));
  return {
    formula_id: formulaId(extracted.product, version),
    product: extracted.product || '',
    product_family: extracted.family || 'unknown',
    version,
    identity_status: 'provisional_pending_Q009',
    ingredients,
    psd: (extracted.psd_design || []).map(i => ({ fraction: i.name ?? i.material, percent: i.percent ?? null })),
    chemical_system: (extracted.binders || []).map(i => i.name ?? i.material),
    functional_additives: (extracted.additives || []).map(i => i.name ?? i.material),
    composition_audit: {
      percent_sum: extracted.percent_sum ?? 0,
      percent_ok: !!extracted.percent_ok,
      complete: !!extracted.percent_ok,
    },
    // pending fields — declared empty, NOT guessed (a known gap, not a value)
    process: null,
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

const REQUIRED = ['formula_id', 'product', 'product_family', 'ingredients', 'composition_audit', 'provenance', 'identity_status'];
const ROLES = new Set(['binder', 'psd_fraction', 'additive']);

/** Light structural validation against the schema's required fields + objective/interpreted contract. */
export function validateFormula(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['not an object'] };
  for (const k of REQUIRED) if (obj[k] == null) errors.push(`missing required field: ${k}`);
  if (!Array.isArray(obj.ingredients)) errors.push('ingredients must be an array');
  else obj.ingredients.forEach((i, n) => {
    if (!i.material) errors.push(`ingredient[${n}] missing material`);
    if (!ROLES.has(i.role)) errors.push(`ingredient[${n}] invalid role: ${i.role}`);
    // the contract: a psd_fraction is the only objective role; others must be flagged interpreted
    const expected = i.role === 'psd_fraction' ? 'objective' : 'interpreted';
    if (i.role_authority && i.role_authority !== expected) errors.push(`ingredient[${n}] role_authority for ${i.role} must be ${expected}`);
  });
  if (obj.provenance && !obj.provenance.document_source) errors.push('provenance.document_source is empty');
  if (obj.identity_status && !['provisional_pending_Q009', 'canonical'].includes(obj.identity_status)) errors.push(`bad identity_status: ${obj.identity_status}`);
  return { ok: errors.length === 0, errors };
}

export default { formulaId, canonicalFormula, validateFormula };
