---
name: analyze-formulation-data
description: Analyze an uploaded formulation / burn-test Excel for Boundary Intelligence — parse sheets, find canonical vs derived axes, compute correlations, flag the composite-axis trap and confounds, judge deltas vs MME, and produce a calibration-style report. Use whenever Rachel/the lab uploads a formulation or test spreadsheet (.xlsx) and we need to extract observations or candidate boundaries.
---

# analyze-formulation-data

## When to use
Any time a formulation / burn-test `.xlsx` is uploaded and we need to turn it into
observations or look for a boundary. This replaces re-writing parsing code each time.

## How to run
```
cd /home/user/matriya-back            # has the xlsx package
node ../maneger-back-/scripts/analyze_formulation.mjs <file.xlsx> --mme <noise_floor>
```
- `--mme` = the lab's noise floor for the response axis (e.g. 1.44 for EXPANSION).
  If unknown, omit it and say so in the report.
- `--sheet "name"` to focus one sheet.

## How to interpret (the thinking, not just the numbers)
The script gives correlations + flags. You must then judge:
1. **Canonical vs derived axis.** If the COMPOSITE-AXIS CHECK fires (e.g.
   `expansion ≈ height/thickness`), that "axis" is NOT canonical — derive it, never
   store it. This is the single most important check (the MEL/granulometry trap).
2. **Boundary vs gradient.** A monotonic correlation is a *sensitivity*, not a
   boundary. A boundary needs an outcome-class crossing (Works→Fails). Say which it is.
3. **Confounding.** Cross-check: is the apparent driver entangled with another axis?
   (e.g. raw `exp~ttf<0` flips once you control thickness.) Always look for the hidden
   variable before claiming a relationship.
4. **vs MME.** A delta below the noise floor is noise, not a finding.
5. **Identity.** Map material aliases to canonical ids (EXOLIT AP435 = APP, MELAFINE =
   melamine). Watch for keyword false-positives (e.g. "CHARMOR" matched as "char").

## Output (always end the report with this)
Produce: (a) findings, (b) calibration verdict vs known lab truth if applicable,
(c) **honest limits** (n, observational, confounded, interpolated values), and
(d) a short **"Improvements & threads"** section — see CLAUDE.md. At minimum:
- one way this analysis or the script could be sharper next time, and
- how this result connects to existing axes (migration 007), the plan, or a prior boundary.

## Related
- `lib/observationContract.js` — validate extracted observations before ingest (`/observation-lint`).
- `docs/E-011-calibration-result.md` — the reference output format.
- `migrations/007_observation_contract.sql` — the canonical axes this should map onto.
