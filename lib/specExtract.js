/**
 * Spec extractor v2 — pulls the QC acceptance block out of a Fresco sheet into a TRACEABLE
 * Product Specification record (the T_relevance side of the decision boundary).
 *
 * Built on three mechanisms (Fresco's pre-scale requirements):
 *   - Document Classifier (lib/docClassify) — what kind of doc + family.
 *   - Parameter Dictionary (lib/parameterDictionary) — label -> canonical axis.
 *   - Unit Normalizer (lib/unitNormalize) — raw unit -> canonical, kept traceable.
 *
 * Spec status is three-state, so a Family-B (dry powder) sheet is not mistaken for
 * "no spec" — its specs are EXTERNAL (in a QC/spec doc), not MISSING. Pure / no I/O.
 */
import { classify } from './docClassify.js';
import { NUMERIC, QUALITATIVE } from './parameterDictionary.js';
import { normalizeRange } from './unitNormalize.js';

// What each family is expected to specify (drives Present / External / Missing).
const EXPECTED = {
  liquid: { numeric: ['ph', 'density', 'wet_viscosity'] },
  // dry powders: these are real specs, just not in the formula sheet → External by default.
  cementitious: { external: ['density', 'compressive_strength', 'flexural_strength', 'water_absorption_pct', 'pull_off_adhesion'] },
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (alias, text) => new RegExp(esc(alias), 'i').test(text);
const rangeNear = (anchor, text) => {
  const re = new RegExp(esc(anchor) + '[^\\d\\n]{0,12}([\\d.]+)\\s*-\\s*([\\d.]+)', 'i');
  const m = text.match(re);
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { min: Math.min(a, b), max: Math.max(a, b) };
};

/**
 * @returns {{product, family, document_type, specification:object,
 *            present_non_standard:object[], needs_external_document:string[], missing:string[]}}
 */
export function extractSpecs(text, fallbackName = '') {
  const t = String(text || '');
  const doc = classify(t);
  const nameM = t.match(/שם\s*מוצר[ ,]+([^,\n]+?)\s*(?:,|\n|$)/);
  const product = (nameM ? nameM[1] : fallbackName).trim();

  const specification = {};
  const present_non_standard = [];
  const extracted = new Set();
  const declaredEmpty = new Set();

  for (const p of NUMERIC) {
    const anchor = p.aliases.find(a => mentions(a, t));
    if (!anchor) continue;                         // axis not mentioned in this sheet
    const r = rangeNear(anchor, t);
    if (!r) { declaredEmpty.add(p.axis); present_non_standard.push({ axis: p.axis, reason: 'QC row present but no range filled' }); continue; }
    const norm = normalizeRange(r.min, r.max, p.source_unit);
    specification[p.axis] = {
      value: norm.canonical, unit: norm.canonical.unit, method: p.method,
      source: `${doc.document_type} (QC block)`, confidence: 'high',
      normalization: { raw: norm.raw, canonical: norm.canonical },
    };
    extracted.add(p.axis);
    if (!norm.normalized) present_non_standard.push({ axis: p.axis, reason: `non-standard unit "${p.source_unit}" — could not normalize` });
  }

  // qualitative checks present in the block → B (present but no numeric scale)
  for (const q of QUALITATIVE) {
    if (q.aliases.some(a => mentions(a, t))) present_non_standard.push({ axis: q.axis, reason: 'qualitative — no numeric scale yet' });
  }

  // C — external specification required (known to be specified elsewhere, not in this doc).
  // Excludes axes already extracted or declared-but-empty here (those are A / B, not C).
  const exp = EXPECTED[doc.family] || {};
  const needs_external_document = [];
  for (const ax of [...(exp.external || []), ...(exp.numeric || [])]) {
    if (!extracted.has(ax) && !declaredEmpty.has(ax) && !needs_external_document.includes(ax)) needs_external_document.push(ax);
  }

  return { product, family: doc.family, document_type: doc.document_type, specification, present_non_standard, needs_external_document, missing: [] };
}

export default { extractSpecs };
