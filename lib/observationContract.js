/**
 * Observation Contract — validation gate (Boundary Intelligence, Phase 0).
 *
 * The Observation Contract is the ONLY irreversible component of the system:
 * context not captured at observation time cannot be reconstructed later.
 * Therefore every write into `observations` MUST pass through validateObservation()
 * before it touches the DB. This is the "entry condition" — not a suggestion.
 *
 * Principles enforced here (the ones the DB schema cannot express on its own):
 *   - Identity Before Aggregation : axis_id + (material_id) must be canonical (FK in DB; existence checked by caller).
 *   - Commensurability            : captured unit/method MUST equal the axis's canonical unit/method.
 *                                   Name-collapse is safe; unit/method-collapse is silently corrupting.
 *   - Evidence Before Boundary    : provenance with a real source is mandatory.
 *   - Capture wide, condition narrow : conditions is open/extensible; never a closed fixed set.
 *   - Noise has to be measurable  : a point that will sit near a boundary needs uncertainty/replicates.
 *
 * This module is pure (no I/O). The caller resolves the axis row from the DB and
 * passes it in, so this can be unit-tested and reused by any ingest path.
 */

/** Fields without which an observation cannot enter the system. */
export const CONTRACT_REQUIRED_FIELDS = Object.freeze([
  'project_id',
  'axis_id',
  'value',
  'unit',
  'method',
  'provenance',
]);

/** Provenance sub-fields required for an observation to be auditable. */
export const PROVENANCE_REQUIRED_FIELDS = Object.freeze([
  'source_type',
  'source_reference',
  'observed_by',
  'observed_at',
]);

export const VALID_OUTCOME_CLASSES = Object.freeze(['works', 'borderline', 'fails']);

const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const norm = (v) => (v == null ? '' : String(v).trim());

/**
 * Validate one observation against the contract and its axis.
 *
 * @param {object} obs   The candidate observation (raw request shape).
 * @param {object|null} axis  The canonical axis row from `axes` (or null if unknown).
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 *   `errors` block the write; `warnings` are recorded but allowed (e.g. missing uncertainty on a single replicate).
 */
export function validateObservation(obs, axis) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(obs)) {
    return { valid: false, errors: ['observation must be an object'], warnings };
  }

  // 1. Required contract fields present.
  for (const f of CONTRACT_REQUIRED_FIELDS) {
    const v = obs[f];
    const missing = v == null || (typeof v === 'string' && v.trim() === '');
    if (missing) errors.push(`missing required field: ${f}`);
  }

  // 2. The empirical point must be a real number.
  if (obs.value != null && !isFiniteNumber(obs.value)) {
    errors.push('value must be a finite number');
  }

  // 3. Axis Authority: the axis must exist and be scalar.
  if (!axis) {
    errors.push(`unknown axis (Axis Authority): "${norm(obs.axis_id)}" is not registered in axes`);
  } else {
    if (axis.is_scalar === false) {
      errors.push(`axis "${axis.axis_id}" is not scalar; decompose to scalar axes (e.g. D10/D50/D90) before observing`);
    }
    // 4. Commensurability: unit + method must match the axis canonically.
    //    This is the layer-0 version of the MEL problem — silently corrupting if skipped.
    if (norm(obs.unit) && norm(axis.canonical_unit) && norm(obs.unit) !== norm(axis.canonical_unit)) {
      errors.push(
        `unit "${norm(obs.unit)}" is not commensurable with axis "${axis.axis_id}" canonical unit "${axis.canonical_unit}" — convert before storing, do not aggregate`
      );
    }
    if (norm(obs.method) && norm(axis.method) && norm(obs.method) !== norm(axis.method)) {
      errors.push(
        `method "${norm(obs.method)}" differs from axis "${axis.axis_id}" method "${axis.method}" — measurements by different methods are not comparable`
      );
    }
  }

  // 5. Evidence Before Boundary: provenance must be real and complete.
  if (obs.provenance != null) {
    if (!isPlainObject(obs.provenance)) {
      errors.push('provenance must be an object');
    } else {
      for (const f of PROVENANCE_REQUIRED_FIELDS) {
        if (norm(obs.provenance[f]) === '') errors.push(`provenance.${f} is required`);
      }
    }
  }

  // 6. Capture wide: conditions must be an (extensible) object. Each entry should be
  //    {value, unit} so conditions are themselves commensurable later.
  const conds = isPlainObject(obs.conditions) ? obs.conditions : null;
  if (obs.conditions != null) {
    if (!conds) {
      errors.push('conditions must be an object (key -> {value, unit})');
    } else {
      for (const [k, c] of Object.entries(conds)) {
        if (!isPlainObject(c) || !isFiniteNumber(c.value) || norm(c.unit) === '') {
          warnings.push(`condition "${k}" should be {value:number, unit:string} to stay aggregable`);
        }
      }
    }
  }

  // 6b. Profile axes (RULE): some axes are a PROFILE, not a scalar — a viscosity reading is
  //     meaningless without (spindle, rpm, temperature). The axis declares required_conditions;
  //     each must be present, or the point is not interpretable and cannot enter.
  if (axis && Array.isArray(axis.required_conditions) && axis.required_conditions.length) {
    for (const rc of axis.required_conditions) {
      const c = conds ? conds[rc] : undefined;
      if (!isPlainObject(c) || c.value == null) {
        errors.push(`axis "${axis.axis_id}" requires condition "${rc}" (profile axis: ${axis.required_conditions.join(' + ')} must be captured per reading)`);
      }
    }
  }

  // 7. Noise must be measurable for any point that could define a boundary.
  const replicates = obs.replicate_count == null ? 1 : obs.replicate_count;
  if (!Number.isInteger(replicates) || replicates < 1) {
    errors.push('replicate_count must be a positive integer');
  }
  if (obs.uncertainty == null) {
    warnings.push('uncertainty missing — cannot compare this point against the axis noise_floor; required for boundary-grade points');
  } else if (!isFiniteNumber(obs.uncertainty) || obs.uncertainty < 0) {
    errors.push('uncertainty must be a non-negative number');
  }

  // 8. Outcome class, if asserted, must be valid and reference the spec used.
  if (obs.outcome_class != null) {
    if (!VALID_OUTCOME_CLASSES.includes(obs.outcome_class)) {
      errors.push(`outcome_class must be one of: ${VALID_OUTCOME_CLASSES.join(', ')}`);
    }
    if (norm(obs.outcome_spec_ref) === '') {
      warnings.push('outcome_class asserted without outcome_spec_ref — classification is not auditable/re-derivable');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Convenience: throw on invalid (for endpoints that prefer exceptions).
 * @returns {{ warnings: string[] }}
 */
export function assertValidObservation(obs, axis) {
  const { valid, errors, warnings } = validateObservation(obs, axis);
  if (!valid) {
    const e = new Error('Observation Contract violation: ' + errors.join('; '));
    e.code = 'OBSERVATION_CONTRACT';
    e.errors = errors;
    throw e;
  }
  return { warnings };
}

export default { validateObservation, assertValidObservation, CONTRACT_REQUIRED_FIELDS };
