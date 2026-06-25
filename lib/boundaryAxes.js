/**
 * Default canonical axes — mirrors the seed in migrations/007_observation_contract.sql.
 * Single source for tooling that needs axis definitions without a DB connection
 * (observation_lint, import_observations). The live endpoint reads the `axes` table;
 * keep this in sync with migration 007.
 */
export const DEFAULT_AXES = [
  { axis_id: 'APP_LOADING', canonical_unit: '%w/w', method: 'gravimetric_formulation', is_scalar: true, noise_floor: null },
  { axis_id: 'FILM_THICKNESS', canonical_unit: 'micron', method: 'thickness_gauge_avg', is_scalar: true, noise_floor: null },
  { axis_id: 'CHAR_HEIGHT', canonical_unit: 'mm', method: 'iso834_furnace_burn', is_scalar: true, noise_floor: null },
  { axis_id: 'CHAR_DENSITY', canonical_unit: 'kg/m3', method: 'char_mass_over_volume', is_scalar: true, noise_floor: null },
  { axis_id: 'TIME_TO_FAILURE', canonical_unit: 'min', method: 'iso834_to_500C', is_scalar: true, noise_floor: null },
];

export const axesById = (axes = DEFAULT_AXES) => Object.fromEntries(axes.map(a => [a.axis_id, a]));

export default { DEFAULT_AXES, axesById };
