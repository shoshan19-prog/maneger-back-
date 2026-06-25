/**
 * E-012 wide→long mapping (pure, no I/O). Turns Rachel's sample-centric E-012 sheet
 * (one row per sample) into contract-shaped observations (one per measured axis), each
 * carrying the shared measurement context as conditions. Single source used by
 * scripts/e012_to_observations.mjs and its test.
 *
 * char_height has no canonical axis — it is captured as a CONDITION (the volume input to
 * char_density), not dropped (Law 4: capture wide).
 */
import { parseCSV } from './observationCsv.js';

// Measured column -> canonical axis (+ its canonical unit/method).
export const E012_AXIS_MAP = [
  { col: 'char_density_kg_m3', axis_id: 'char_density', unit: 'kg/m3', method: 'char_mass_over_volume' },
  { col: 'char_integrity_score', axis_id: 'char_quality', unit: 'rating (ordinal)', method: 'Char inspection (cohesion/structure)' },
  { col: 'time_to_failure_min', axis_id: 'time_to_failure', unit: 'min', method: 'heat_to_500C_count_minutes' },
];
// Wide column -> condition key + unit (the locked measurement context, all numeric).
export const E012_COND_MAP = [
  { col: 'initial_film_thickness', key: 'initial_film_thickness', unit: 'micron' },
  { col: 'exposed_area', key: 'exposed_area', unit: 'cm2' },
  { col: 'burn_profile', key: 'burn_profile', unit: 'C' },
  { col: 'sample_age', key: 'sample_age', unit: 'days' },
  { col: 'char_height_mm', key: 'char_height', unit: 'mm' },
];

const num = (v) => (v == null || String(v).trim() === '') ? undefined : Number(v);
const str = (v) => (v == null) ? '' : String(v).trim();

/** @returns {{observations: object[], samples: number}} */
export function e012ToObservations(csvText) {
  const rows = parseCSV(csvText);
  if (!rows.length) return { observations: [], samples: 0 };
  const header = rows.shift().map(h => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const observations = [];
  let samples = 0;
  for (const cells of rows) {
    const g = (c) => idx[c] == null ? undefined : cells[idx[c]];
    const sample = str(g('sample_id'));
    if (!sample) continue;
    samples++;
    const conditions = {};
    for (const c of E012_COND_MAP) { const v = num(g(c.col)); if (v != null) conditions[c.key] = { value: v, unit: c.unit }; }
    const provenance = {
      source_type: 'lab_measurement',
      source_reference: `E-012:${str(g('formulation_id'))}:${str(g('variable_changed'))}=${str(g('variable_level'))}`,
      observed_by: str(g('operator')), observed_at: str(g('date')),
    };
    for (const m of E012_AXIS_MAP) {
      const value = num(g(m.col));
      if (value == null) continue;
      observations.push({
        project_id: 'INT-TFX', experiment_id: 'E-012', replicate_group: sample,
        axis_id: m.axis_id, value, unit: m.unit, method: m.method, conditions, provenance,
      });
    }
  }
  return { observations, samples };
}

export default { e012ToObservations, E012_AXIS_MAP, E012_COND_MAP };
