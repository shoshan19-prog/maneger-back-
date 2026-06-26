# Reference Corpus — Fresco's lab knowledge as a strategic asset

Rachel's `laboratory/` Drive folder is almost certainly **the evolution of Fresco's R&D
knowledge** — formulations, experiments, specifications, decisions, failures, versions. So we
treat it not as a one-off extraction source but as MATRIYA's **Reference Corpus**: the real
record the system learns Fresco's actual workflow from, instead of synthetic examples.

## Protection rules (treat as a strategic asset)
1. **Snapshot every document.** `.corpus/specsrc/*.txt` + a deterministic manifest
   (`scripts/corpus_cache.mjs` → sha1/bytes/lines). A snapshot is auditable and lets us
   compare parser versions on the exact same input.
2. **Never modify the source.** The corpus is append-only. `corpus_cache.mjs` warns if a
   snapshot's sha1 changes or a file disappears vs the prior manifest.
3. **Derive layers, don't touch originals.** All knowledge is extracted *from* the snapshot
   into separate artifacts; the source text is read-only.
4. **Keep it out of git.** `.corpus/` is git-ignored — proprietary formulations never enter
   version control. Only the *derived, non-sensitive* artifacts (spec library, tooling) are
   committed.

## Derived knowledge layers (all from the same snapshot)
```
Reference Corpus (snapshot, read-only)
   ├── Formula Library      (materials × %)            — what it's made of
   ├── Spec Library         (T_relevance, per product) — when it's "good"   [built: v3]
   ├── Experiment records   (runs, conditions, results)— what was measured
   ├── SOP / Protocol       (how it's made/measured)
   └── Evidence Layer       (source_document/section/text per datum)        [built]
```

## Why this matters
A confusion matrix, a boundary, a recommendation — all are only as trustworthy as the corpus
beneath them. By snapshotting and never mutating the source, every derived claim stays
traceable to an immutable original. This is Evidence-first at the corpus level: MATRIYA learns
from **real Fresco R&D history**, and can always show exactly which document any value came from.

## Two kinds of authority (Fresco)
The corpus is Rachel's authentic work environment, built and organized over years — so its
*organization* is itself knowledge, and Rachel is not only a validator but a primary source of
organizational knowledge. We therefore separate two authorities per document:

- **Document Authority** — which version is canonical: `official_source` (yes/no) + `superseded_by`.
- **Domain Authority** — who knows/decides about it: `owner` · `created_by` · `validated_by`.

Recorded per record (ownership block, `owner` defaults to Rachel for this corpus). When other
people contribute knowledge later, the source and organizational context are preserved — the
system knows not just what is written, but **who can decide when it is unclear**.

What this does NOT assert (still needs content/results review): that every document is
professionally correct, every formulation succeeded, or every decision was optimal.

## Status
- Snapshot + manifest + immutability guard: **built** (`scripts/corpus_cache.mjs`).
- Round-1 corpus: 8 real Formula Sheets (git-ignored).
- Next layers to derive from the corpus (after Ground Truth clears): Formula Library,
  Experiment records, SOP — each a separate pass over the same immutable snapshot.
