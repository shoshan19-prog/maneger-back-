# Real learning event — PR-TFX primer (the system's first REAL boundary)

Source: Rachel's lab story, PR-TFX iterations 002/003/004 (Feb–Mar 2026). This is real
"where it breaks" knowledge — the asset MATRIYA exists to capture.

## What happened
Across 3 primer iterations, adding **potassium silicate** to the PR-TFX primer caused an
instant **"shock" (gelation/hardening)** → cracked, non-uniform film, poor/no cure.
Rachel ran controlled mini-tests: K-silicate hardened the primer **every time**, across
**types** (KSIL34, P35, KASIL 2135, K28) and **dilutions** (20/35/50% water).

## The boundary (captured: config/incompatibility_boundaries_v1.json, INCOMP-001)
- **Verified (by repeated controlled tests):** *any* potassium silicate, regardless of type
  or dilution, is incompatible with this primer → shock → film failure.
- **Open (not isolated):** WHICH component reacts — zinc borate, zinc phosphate, melamine, or
  the 2403/58 emulsions. Rachel's hypothesis evolved 002→004 toward zinc borate/phosphate + emulsions.
- **Trend:** 002 (no cure, many cracks) → 003 (130 µm, fewer) → 004 (55 µm, smooth, micro-cracks).

## The next experiment (what the system would propose)
**One-component-at-a-time isolation:** K-silicate + ONLY zinc_borate; + ONLY zinc_phosphate;
+ ONLY melamine; + ONLY each emulsion. The one(s) that gel = the culprit; the rest = the
**bypass route** (the R&D payoff — how to use K-silicate after all). This is exactly the
`to_verify` an isolation experiment that upgrades a hypothesis to VERIFIED.

## What this teaches us about the ENGINE (a real gap)
Our `deriveBoundary` handles **continuous threshold** boundaries (density → fire-time crossing).
This is a **categorical compatibility** boundary (material A + material B → catastrophic
failure). They are different shapes. The boundary engine needs a **second type**:
`incompatibilityBoundary` — confirmed when A+B fails across controlled variations, with
attribution pending one-factor isolation. Captured now as a registry; the engine extension
is a clean next build (no Rachel needed) once we choose to.

## How it connects
- This is a **material × material negative coupling** — complements `property_couplings`
  (property × property) and `mechanism_hypotheses` (material → property).
- It is arguably the system's **first real partially-verified boundary** — categorical, not
  the density scan, but real and already supported by Rachel's controlled tests.
- It confirms the thesis on live data: the lab generates boundary knowledge daily; the job is
  to structure it (identity + evidence + the where-it-breaks) instead of losing it in prose.
