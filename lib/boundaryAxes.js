/**
 * Default canonical axes — single source for tooling that needs axis definitions without a
 * DB connection (observation_lint, import_observations, derive_boundary).
 *
 * Derived from config/property_registry_canonical_v1.json (the Axis Authority, snake_case
 * ids per decision D6) PLUS the input/condition axes that are not "measured properties"
 * (APP_LOADING, FILM_THICKNESS). Keep in sync with migrations 010 + 007.
 */
import { readFileSync } from 'fs';

// Input / condition axes (scanned or controlled — not in the property registry).
const INPUT_AXES = [
  { axis_id: 'APP_LOADING', canonical_unit: '%w/w', method: 'gravimetric_formulation', is_scalar: true, noise_floor: null },
  { axis_id: 'FILM_THICKNESS', canonical_unit: 'micron', method: 'thickness_gauge_avg', is_scalar: true, noise_floor: null },
];

function loadRegistryAxes() {
  try {
    const reg = JSON.parse(readFileSync(new URL('../config/property_registry_canonical_v1.json', import.meta.url), 'utf8'));
    return (reg.properties || []).map(p => ({
      axis_id: p.property_id, canonical_unit: p.unit, method: p.method,
      is_scalar: true, noise_floor: null,
      direction_of_good: p.direction_of_good, evidence_tier: p.evidence_tier,
      // RULE plumbing: a profile axis (e.g. viscosity) must carry its disambiguating
      // conditions and is not boundary-eligible as a single scalar.
      profile: p.profile === true,
      required_conditions: Array.isArray(p.required_conditions) ? p.required_conditions : undefined,
      measurement_protocol: Array.isArray(p.measurement_protocol) ? p.measurement_protocol : undefined,
      measurement_protocol_id: p.measurement_protocol_id,
      measurement_protocol_version: p.measurement_protocol_version,
    }));
  } catch (_) { return []; }
}

export const DEFAULT_AXES = [...loadRegistryAxes(), ...INPUT_AXES];

export const axesById = (axes = DEFAULT_AXES) => Object.fromEntries(axes.map(a => [a.axis_id, a]));

export default { DEFAULT_AXES, axesById };
