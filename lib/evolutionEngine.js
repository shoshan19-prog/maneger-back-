/**
 * Evolution Engine — the TRANSITION is the scientific unit, not the version (Fresco). A version is
 * a snapshot; a transition is a unit of LEARNING: problem → change → effect → did it survive. Pure.
 *
 * For every transition (parent → child, along the human-declared `based_on` lineage) it extracts
 * FOUR Δ types:
 *   Composition Δ — which materials were added / removed / re-proportioned
 *   Process Δ     — mixing order / rpm / time / shear changed
 *   Reasoning Δ   — the rationale that was written (verbatim — the gold; SOP boilerplate filtered)
 *   Decision Δ    — based_on | fixed | passed | rejected (from the note language)
 *
 * Then three pattern layers ABOVE the transitions:
 *   recurringChanges  — a change that repeats across transitions → an edit becomes a TREND
 *   coOccurringMoves  — changes that always travel together → a formula becomes a STRATEGY
 *   problemFixes      — problem(note) → change → (later) structural fix → a DECISION CHAIN
 *
 * Identity caveat: `based_on` is a BARE suffix that RECYCLES across years (Law 2: Identity Before
 * Aggregation) — it is resolved to the chronologically-closest prior version with that key, never
 * by suffix alone.
 */

const norm = (s) => (s || '').toString().trim();

// Material → functional family, so a transition can be read at the strategy level, not just per-material.
const FAMILY_RULES = [
  [/exolit|frcross|frcros|ap\s?435|polyphosphate|app/i, 'acid_source'],
  [/mowilith|encor|vinnapas|emultex|ldm|dm230|ez3\d/i, 'binder'],
  [/tiona|kronos|titan|tio2|blr\s?895/i, 'tio2'],
  [/charmor|pentaer|penta|pm\s?40|dp15/i, 'polyol'],
  [/melafine|melamine|aflammit|pmn/i, 'melamine'],
  [/lapinus|cf10|fiber|fibre|enhancer/i, 'fiber'],
  [/water|מים/i, 'water'],
  [/xanthan|kelzan|combizell|rm-?825|optigel|viscotex|rheolate|cellulose|thicken|מסמיך/i, 'thickener'],
  [/agitan|troykyd|antifoam|נוגד קצף|אנטי\s?קצף/i, 'antifoam'],
  [/orotan|dispex|disperb|dispersant|אורוטן/i, 'dispersant'],
  [/texanol/i, 'coalescent'],
  [/vinkocid|mergal|biocid|cmif|ביוציד/i, 'biocide'],
];
export const familyOf = (material) => { for (const [re, f] of FAMILY_RULES) if (re.test(material)) return f; return 'other'; };

const SIG = 0.3; // a % move smaller than this is rounding noise, not a decision

// ---- date handling (DD.MM.YYYY, tolerant) → comparable number ----
const dnum = (d) => {
  const m = String(d || '').match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
  if (!m) return 0;
  let [, dd, mm, yy] = m; yy = yy.length === 2 ? '20' + yy : yy;
  return Number(yy) * 10000 + Number(mm) * 100 + Number(dd);
};

/** Resolve a child's bare `based_on` key to the full parent version (closest one dated before it). */
export function resolveParent(child, versions) {
  const key = norm(child.based_on);
  if (!key) return null;
  const cd = dnum(child.date);
  const cands = versions.filter(v => norm(v.key) === key && v.id !== child.id);
  if (!cands.length) return null;
  // A parent MUST precede its child in time (Law 2 + causality). With recycled keys, a based_on
  // that only resolves to a LATER-dated version is unreliable → no transition, never a future parent.
  const before = cands.filter(v => dnum(v.date) && cd && dnum(v.date) <= cd).sort((a, b) => dnum(b.date) - dnum(a.date));
  return before[0] || null;
}

// Reasoning vs SOP boilerplate: keep notes that carry a DECISION/rationale, drop pure procedure.
const RATIONALE_RE = /מבוסס|על בסיס|על פי|הוספ|הקטנ|הגדל|החלפ|הורד|תיקון|תוקן|נפסל|עבר|נשלח|בעיה|מוקצף|התחמם|קרח|שיקוע|נוזלי מדי|סמיך מדי/;
const BOILER_RE = /^\s*(\d+\s*דק|שעה|וודא שאין קצף|הכנס.*דספרסיה|הכנס ללא גושים|פזר)/;
const rationaleNotes = (notes = []) => notes.map(norm).filter(n => n && RATIONALE_RE.test(n) && !BOILER_RE.test(n));

const DECISION_RULES = [
  [/נפסל|נכשל|לא טוב/, 'rejected'],
  [/תוקן|תיקון|על פי תיקוני/, 'fixed'],
  [/עבר|אושר|תקין|הצליח/, 'passed'],
  [/מבוסס|על בסיס|על פי/, 'based_on'],
];
export const decisionStatus = (notes = []) => { const t = notes.map(norm).join(' '); for (const [re, s] of DECISION_RULES) if (re.test(t)) return s; return 'unknown'; };

/** One transition parent → child, with all four Δ types. */
export function transition(parent, child) {
  const pc = parent.composition || {}, cc = child.composition || {};
  const added = [], removed = [], changed = [];
  for (const m of Object.keys(cc)) if (!(m in pc)) added.push({ material: m, family: familyOf(m), percent: cc[m] });
  for (const m of Object.keys(pc)) if (!(m in cc)) removed.push({ material: m, family: familyOf(m), percent: pc[m] });
  for (const m of Object.keys(cc)) if (m in pc && Math.abs((cc[m] || 0) - (pc[m] || 0)) >= SIG) changed.push({ material: m, family: familyOf(m), from: pc[m], to: cc[m], delta: Math.round(((cc[m] || 0) - (pc[m] || 0)) * 100) / 100 });
  const pproc = (parent.process || []).join(' | '), cproc = (child.process || []).join(' | ');
  return {
    from: parent.id, to: child.id,
    composition: { added, removed, changed },
    process: { changed: pproc !== cproc, parent_steps: (parent.process || []).length, child_steps: (child.process || []).length },
    reasoning: { notes: rationaleNotes(child.notes) },
    decision: { based_on: parent.id, status: decisionStatus(child.notes) },
  };
}

/** Build the transition stream along the based_on lineage (the decision edges). */
export function buildTransitions(versions = []) {
  const out = [];
  for (const child of versions) {
    const parent = resolveParent(child, versions);
    if (parent) out.push(transition(parent, child));
  }
  return out;
}

// ---- pattern layer ----

/** Signed change tokens for a transition, at material level and family level. */
export function changeTokens(t) {
  const mat = [], fam = new Map(); // family → net direction
  const bump = (family, dir) => fam.set(family, (fam.get(family) || 0) + dir);
  for (const a of t.composition.added) { mat.push(`+${a.material}`); bump(a.family, +1); }
  for (const r of t.composition.removed) { mat.push(`-${r.material}`); bump(r.family, -1); }
  for (const c of t.composition.changed) { mat.push(`${c.delta > 0 ? '↑' : '↓'}${c.material}`); bump(c.family, Math.sign(c.delta)); }
  const famTokens = [...fam.entries()].filter(([, d]) => d !== 0).map(([f, d]) => `${d > 0 ? '+' : '-'}${f}`);
  return { material: mat, family: famTokens };
}

/** A change that repeats across transitions → a trend (not a one-off edit). */
export function recurringChanges(transitions, { min = 2 } = {}) {
  const matC = new Map(), famC = new Map();
  for (const t of transitions) { const { material, family } = changeTokens(t);
    for (const m of material) matC.set(m, (matC.get(m) || 0) + 1);
    for (const f of family) famC.set(f, (famC.get(f) || 0) + 1);
  }
  const top = (m) => [...m.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).map(([token, count]) => ({ token, count }));
  return { material: top(matC), family: top(famC) };
}

/** Family-direction moves that travel TOGETHER in the same transition → a strategy. */
export function coOccurringMoves(transitions, { min = 2 } = {}) {
  const pairC = new Map();
  for (const t of transitions) {
    const fam = changeTokens(t).family.sort();
    for (let i = 0; i < fam.length; i++) for (let j = i + 1; j < fam.length; j++) { const k = `${fam[i]} & ${fam[j]}`; pairC.set(k, (pairC.get(k) || 0) + 1); }
  }
  return [...pairC.entries()].filter(([, c]) => c >= min).sort((a, b) => b[1] - a[1]).map(([combo, count]) => ({ combo, count }));
}

const PROBLEMS = [[/מוקצף|קצף/, 'foam'], [/התחמם|קרח|חם/, 'exotherm'], [/שיקוע|משקע/, 'sediment'], [/סמיך מדי|נוזלי מדי|צמיג/, 'viscosity']];
/** problem(note) → the family moves that accompanied it → a decision chain seed. */
export function problemFixes(transitions) {
  const out = [];
  for (const t of transitions) {
    const text = t.reasoning.notes.join(' ');
    for (const [re, label] of PROBLEMS) if (re.test(text)) out.push({ transition: `${t.from}→${t.to}`, problem: label, moves: changeTokens(t).family, quote: t.reasoning.notes.find(n => re.test(n)) });
  }
  const byProblem = out.reduce((a, x) => (a[x.problem] = (a[x.problem] || 0) + 1, a), {});
  return { events: out, byProblem };
}

export default { familyOf, resolveParent, transition, buildTransitions, changeTokens, recurringChanges, coOccurringMoves, problemFixes, decisionStatus };
