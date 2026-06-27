/**
 * Formula Extractor — reads the ingredient/batch table out of a Fresco formula sheet into a
 * structured formula. The spec extractor (lib/specExtract.js) deliberately ignores this table —
 * but for these documents the table IS the knowledge: the QC block is near-empty while every doc
 * carries a full formula. Captures the objective row facts (material, batch amount, percent,
 * quantity) and tags PSD/granulometry fractions — the identity variable David named. Pure / no I/O.
 *
 * Boundary (descriptive, held): the ROW VALUES are objective — read straight from the document.
 * The ROLE tag is a light, declared heuristic: `psd_fraction` is MECHANICAL (the material name is
 * itself a particle-size range / mesh), `binder` is a keyword match. Roles are marked provisional;
 * they are never asserted as derived knowledge — only the row facts are.
 *
 * Maps to David's Formula = Chemical System (binders) + PSD Design (psd_fraction) + Functional
 * Premix (additives) + Manufacturing Strategy. Verified scope per David: B-4 + Dry Powder.
 */
import { classify } from './docClassify.js';

const PERCENT = /(\d+(?:\.\d+)?)\s*%/;
const NUM = /^-?\d+(?:\.\d+)?$/;

// A PSD/granulometry fraction: the MATERIAL NAME itself is a particle-size range or a mesh number
// (e.g. "0-0.8", "0.8-1.4", "1.4-2.5", "0-700", "-200", "SILICA 0-0.8"). Mechanical → objective.
// Anchored to the whole name (with an optional silica/sand prefix) so binder codes like "B-100"
// are NOT mistaken for a fraction.
const PSD_RE = /^(?:silica|sand|חול)?\s*(?:\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?|-\d{2,3})\s*$/i;
const BINDER_RE = /\b(cement|wite\s*cement|white\s*cement|alumina\s*cement|hydrated\s*lime|hydraulic\s*lime|n\.?h\.?l|סיד|צמנט)\b/i;

/** Light, declared-heuristic role. psd_fraction is mechanical/objective; binder is keyword-based. */
export function classifyRole(name) {
  if (PSD_RE.test(name.trim())) return 'psd_fraction';
  if (BINDER_RE.test(name)) return 'binder';
  return 'additive';
}

// Lines that mark the END of the ingredient table (QC block or metadata footer).
const STOP_RE = /^\s*(בדיקות|שם\s*ה?מוצר|מספר\s*מנה|מס'?\s*מנה|מספר\s*דוגמא|משקל\s*סגולי|שם\s*לבורנט|מנהל\s*מעבדה|יש\s*להעביר)/;
// The ingredient-table header: material + percent columns.
const HEADER_RE = /חומר.*אחוז/;

const productOf = (t) => { const m = t.match(/שם\s*ה?מוצר[ ,]+([^,\n]+?)\s*(?:,|\n|$)/); return m ? m[1].trim() : ''; };
const num = (s) => { const v = parseFloat(s); return Number.isFinite(v) ? v : null; };

function parseRow(line) {
  const cells = line.split(',').map(c => c.trim());
  const name = cells[0];
  if (!name) return null;
  const rest = cells.slice(1);
  const pctCell = rest.find(c => PERCENT.test(c));
  const percent = pctCell ? num(pctCell.match(PERCENT)[1]) : null;
  const nums = rest.filter(c => NUM.test(c)).map(num);
  // batch = first plain number; quantity = last plain number (the kg / quantities column).
  const batch = nums.length ? nums[0] : null;
  const quantity = nums.length > 1 ? nums[nums.length - 1] : null;
  return { name, batch, percent, quantity, role: classifyRole(name) };
}

/**
 * Extract the structured formula from a formula-sheet text.
 * @returns { product, family, document_type, ingredients[], psd_design[], binders[], additives[],
 *            ingredient_count, percent_sum, percent_ok }
 */
export function extractFormula(text, fallbackProduct = '') {
  const doc = classify(text);
  const lines = text.split(/\r?\n/);
  const ingredients = [];
  let inTable = false;
  for (const line of lines) {
    if (!inTable) { if (HEADER_RE.test(line)) inTable = true; continue; }
    if (STOP_RE.test(line)) break;                 // reached QC block / footer
    if (!line.trim() || !line.includes(',')) continue;
    const row = parseRow(line);
    // a real ingredient row has a name and at least one numeric (batch or percent)
    if (row && row.name && (row.batch != null || row.percent != null)) ingredients.push(row);
  }
  const by = (r) => ingredients.filter(i => i.role === r);
  const percent_sum = ingredients.reduce((s, i) => s + (i.percent || 0), 0);
  return {
    product: productOf(text) || fallbackProduct,
    family: doc.family,
    document_type: doc.document_type,
    ingredients,
    psd_design: by('psd_fraction'),
    binders: by('binder'),
    additives: by('additive'),
    ingredient_count: ingredients.length,
    percent_sum: Math.round(percent_sum * 100) / 100,
    percent_ok: ingredients.length > 0 && Math.abs(percent_sum - 100) <= 1.0, // self-audit: rows summed?
  };
}

export default { extractFormula, classifyRole };
