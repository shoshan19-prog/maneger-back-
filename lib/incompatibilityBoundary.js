/**
 * Incompatibility boundary — the categorical boundary type the PR-TFX lab data revealed
 * (material A + material B -> catastrophic failure), distinct from deriveBoundary's
 * continuous threshold. Confirmed when an agent fails across all its variations; the
 * culprit component is isolated only by one-component-at-a-time tests.
 *
 * Pure / no I/O.
 *
 * @param {Array<{agent:string, components:string[], outcome:'fail'|'pass', variant?:string}>} tests
 *   each = adding `agent` to a system containing `components`, with `outcome`.
 * @returns {object} verdict
 */
export function deriveIncompatibility(tests, opts = {}) {
  const t = (tests || []).filter(x => x && x.agent && Array.isArray(x.components) && /^(fail|pass)$/.test(x.outcome));
  if (t.length < 2) return { status: 'INCONCLUSIVE', reason: 'need >= 2 tests', n: t.length };

  const agent = t[0].agent;
  const fails = t.filter(x => x.outcome === 'fail');
  const passes = t.filter(x => x.outcome === 'pass');

  // broadly incompatible = the agent fails across variants and never passes
  const broadly_incompatible = fails.length >= 2 && passes.length === 0;

  // components present when it FAILS
  const inFails = new Set(fails.flatMap(x => x.components));
  // a component is exonerated if some PASS test contained it together with the agent
  const exonerated = new Set(passes.flatMap(x => x.components));
  const candidates = [...inFails].filter(c => !exonerated.has(c));

  // isolation: a single-component failing test names a confirmed culprit
  const isolatedCulprits = fails.filter(x => x.components.length === 1).map(x => x.components[0]);

  let status, next_experiment = null;
  if (isolatedCulprits.length) {
    status = 'VERIFIED';
  } else if (broadly_incompatible) {
    status = 'PARTIAL_VERIFIED';
    next_experiment = `Isolate: add ${agent} to a system with ONLY each candidate, one at a time — ` +
      candidates.join(', ') + '. The one(s) that fail = culprit; the rest = the bypass route.';
  } else {
    status = passes.length ? 'COMPATIBLE_OR_CONDITIONAL' : 'INCONCLUSIVE';
  }

  return {
    agent, status, broadly_incompatible,
    n: t.length, n_fail: fails.length, n_pass: passes.length,
    culprits: isolatedCulprits.length ? [...new Set(isolatedCulprits)] : null,
    candidates: isolatedCulprits.length ? null : candidates,
    exonerated: [...exonerated],
    next_experiment,
  };
}

export default { deriveIncompatibility };
