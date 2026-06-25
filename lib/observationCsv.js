/**
 * Parse the Excel-friendly observation CSV (lab template) into contract-shaped observations.
 * Single source used by BOTH scripts/import_observations.mjs and the /api/observations/import-csv
 * endpoint, so the lab template, the CLI, and the live ingest button all agree.
 *
 * Columns: project_id, experiment_id, material_id, axis_id, value, unit, method,
 *   uncertainty, replicate_count, replicate_group, outcome_class, outcome_spec_ref,
 *   observed_by, observed_at, source_type, source_reference, cond_<AXIS>_value, cond_<AXIS>_unit
 * Pure / no I/O.
 */
export function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}

const numOrUndef = (v) => (v == null || String(v).trim() === '') ? undefined : Number(v);
const strOrUndef = (v) => (v == null || String(v).trim() === '') ? undefined : String(v).trim();

/** @returns {{observations: object[]}} */
export function parseObservationsCsv(text) {
  const [header, ...lines] = parseCSV(text);
  if (!header) return { observations: [] };
  const cols = header.map(h => h.trim());
  const observations = lines.map(cells => {
    const r = {}; cols.forEach((c, i) => r[c] = cells[i]);
    const o = {
      project_id: strOrUndef(r.project_id), experiment_id: strOrUndef(r.experiment_id),
      material_id: strOrUndef(r.material_id), axis_id: strOrUndef(r.axis_id),
      value: numOrUndef(r.value), unit: strOrUndef(r.unit), method: strOrUndef(r.method),
      uncertainty: numOrUndef(r.uncertainty), replicate_count: numOrUndef(r.replicate_count),
      replicate_group: strOrUndef(r.replicate_group), outcome_class: strOrUndef(r.outcome_class),
      outcome_spec_ref: strOrUndef(r.outcome_spec_ref),
      provenance: {
        source_type: strOrUndef(r.source_type), source_reference: strOrUndef(r.source_reference),
        observed_by: strOrUndef(r.observed_by), observed_at: strOrUndef(r.observed_at),
        // protocol identity (commensurability over time): which protocol id+version measured this
        measurement_protocol_id: strOrUndef(r.measurement_protocol_id),
        measurement_protocol_version: strOrUndef(r.measurement_protocol_version),
      },
      conditions: {},
    };
    for (const c of cols) {
      const m = c.match(/^cond_(.+)_value$/);
      if (m && strOrUndef(r[c]) !== undefined) o.conditions[m[1]] = { value: Number(r[c]), unit: strOrUndef(r[`cond_${m[1]}_unit`]) || '' };
    }
    return o;
  });
  return { observations };
}

export default { parseCSV, parseObservationsCsv };
