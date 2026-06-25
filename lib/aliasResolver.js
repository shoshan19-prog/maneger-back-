/**
 * Material identity resolver — maps any material name / trade name / alias to its
 * canonical material_id. The operational defense against the MEL/Melamine/Melafine
 * and APP/EXOLIT identity fracture (Law 2: Identity Before Aggregation).
 *
 * Pure / no I/O. Built from lib/materialsSeed.js, but accepts any materials list
 * (e.g. rows from the `materials` table) so it works against live data too.
 */
import { MATERIALS } from './materialsSeed.js';

/** Normalize for matching: lowercase, collapse non-alphanumerics. */
const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Build a resolver from a materials list (default: the seed).
 * Each material: { material_id, material_name, aliases:[...] }.
 * @returns {{ resolve:(name:string)=>({material_id,matched_on}|null), size:number }}
 */
export function buildResolver(materials = MATERIALS) {
  const map = new Map(); // normalized -> {material_id, matched_on}
  const add = (key, id, matched_on) => {
    const k = norm(key);
    if (!k) return;
    const prev = map.get(k);
    if (prev && prev.material_id !== id) {
      // collision between two canonical materials on the same alias — flag, keep first.
      map.set(k, { ...prev, ambiguous: true });
      return;
    }
    if (!prev) map.set(k, { material_id: id, matched_on });
  };
  for (const m of materials) {
    add(m.material_id, m.material_id, 'id');
    if (m.material_name) add(m.material_name, m.material_id, 'name');
    for (const a of (m.aliases || [])) add(a, m.material_id, 'alias');
  }
  const resolve = (name) => {
    const hit = map.get(norm(name));
    return hit ? { material_id: hit.material_id, matched_on: hit.matched_on, ambiguous: !!hit.ambiguous } : null;
  };
  return { resolve, size: map.size };
}

/** Convenience: resolve one name against the seed. */
export function resolveMaterial(name, materials = MATERIALS) {
  return buildResolver(materials).resolve(name);
}

export default { buildResolver, resolveMaterial };
