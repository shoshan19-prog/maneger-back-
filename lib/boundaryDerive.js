/**
 * Boundary derivation (LAW-BOUNDARY-001: boundaries are derived, never stored).
 *
 * Given observation points on an INPUT axis (the scanned variable, e.g. CHAR_DENSITY)
 * each with a RESPONSE value and an outcome class, locate the Works->Fails boundary,
 * bracket it as an interval, and translate response-noise into boundary-location
 * uncertainty via the local slope — the commensurable step from the pre-registration:
 *
 *     sigma(boundary, input)  =  MME(response) / |d(response)/d(input)|
 *
 * Rules enforced here:
 *  - A boundary requires BOTH a Works and a Fails point bracketing it (Risk #4).
 *  - Direction (polarity) is derived from the data (fails-above vs fails-below).
 *  - A monotonicity flag is reported (a non-monotonic response near the crossing is suspect).
 *  - separable = the response change across the crossing exceeds MME (else it is noise).
 */

const CLASS = { works: 'works', borderline: 'borderline', fails: 'fails' };

/**
 * @param {Array<{input:number, response:number, outcome:'works'|'borderline'|'fails'}>} points
 * @param {{mme?:number}} opts  mme = noise floor on the RESPONSE axis
 * @returns {object} derivation result
 */
export function deriveBoundary(points, opts = {}) {
  const mme = opts.mme;
  const pts = (points || [])
    .filter(p => p && Number.isFinite(p.input) && Number.isFinite(p.response) && CLASS[p.outcome])
    .sort((a, b) => a.input - b.input);

  if (pts.length < 2) return { bracketed: false, reason: 'need >= 2 valid points', n: pts.length };

  const works = pts.filter(p => p.outcome === 'works');
  const fails = pts.filter(p => p.outcome === 'fails');
  if (!works.length || !fails.length) {
    return { bracketed: false, reason: 'a boundary needs both a Works and a Fails point (bracketing)', n: pts.length,
             have: { works: works.length, fails: fails.length } };
  }

  // Direction: do failures sit ABOVE or BELOW works on the input axis?
  const meanWorksInput = works.reduce((s, p) => s + p.input, 0) / works.length;
  const meanFailsInput = fails.reduce((s, p) => s + p.input, 0) / fails.length;
  const failsAbove = meanFailsInput > meanWorksInput;
  const direction = failsAbove ? 'fails_above' : 'fails_below';

  // The crossing brackets: closest Works and Fails on either side of the transition.
  const lastWorks = failsAbove ? works[works.length - 1] : works[0];
  const firstFails = failsAbove ? fails[0] : fails[fails.length - 1];
  const lo = Math.min(lastWorks.input, firstFails.input);
  const hi = Math.max(lastWorks.input, firstFails.input);
  const boundary = (lo + hi) / 2;

  // Local slope of response vs input across the crossing.
  const dInput = firstFails.input - lastWorks.input;
  const dResp = firstFails.response - lastWorks.response;
  const slope = dInput !== 0 ? dResp / dInput : null;

  // Commensurable uncertainty on the boundary location (input units).
  let sigma = null;
  if (mme != null && slope && slope !== 0) sigma = Math.abs(mme / slope);

  // Separability: is the response change across the crossing above the noise floor?
  const separable = mme != null ? Math.abs(dResp) > mme : null;

  // Monotonicity of response along the input axis (sanity check; a cliff is fine, a zigzag is not).
  let monotonic = true; let dir = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].response - pts[i - 1].response;
    if (d === 0) continue;
    const s = Math.sign(d);
    if (dir === 0) dir = s; else if (s !== dir) { monotonic = false; break; }
  }

  return {
    bracketed: true,
    direction,
    boundary,
    interval: [lo, hi],
    sigma,
    confidence_interval: sigma != null ? [boundary - 2 * sigma, boundary + 2 * sigma] : null,
    slope,
    separable,
    monotonic,
    n: pts.length,
    crossing: { works: { input: lastWorks.input, response: lastWorks.response },
                fails: { input: firstFails.input, response: firstFails.response } },
    notes: [
      mme == null ? 'no MME given: sigma/separability not computed' : null,
      !monotonic ? 'response not monotonic across scan — possible confound or noise' : null,
      hi - lo === 0 ? 'works and fails at same input — degenerate bracket' : null,
    ].filter(Boolean),
  };
}

export default { deriveBoundary };
