# The Learning Cycle — end-to-end acceptance run

*This is the definition of done for the architecture. Not "is it built" — "does it run
with real lab data." After the Ingest button works end-to-end, the next step is NOT a new
capability. It is running this cycle once, with Rachel's real numbers.*

## What actually changed

The Ingest button is not a UI feature. It is an architectural change in **who produces
knowledge**:

```
before                         after
Excel → מפתח → Scripts → DB    Excel → רחל → Ingest → DB
```

For the first time the **laboratory is the direct knowledge producer** of the system —
`Laboratory → MATRIYA` with no technical operator in the pipe.

## The real gate (not migration 007)

Migration 007 is a plumbing prerequisite. The *real* threshold is:

```
Raw Data  →  Trusted Evidence
```

Every CSV that enters must become evidence we can act on — or be rejected with a reason.
That gate is now enforced in two visible steps, before anything is written:

1. **Preview (dry-run)** — `POST /api/observations/import-csv?dry_run=1`. Parses +
   validates through the Observation Contract, writes nothing. Shows: detected / valid /
   rejected (+per-row reason), new materials (no canonical identity), unknown axes.
   → "Proceed?"
2. **Import** — `POST /api/observations/import-csv`. Inserts the valid rows, then returns
   value to the lab: inserted, rejected, new materials, new axes, **contradictions
   detected**, **boundary candidates** (response axes that now have both a Works and a
   Fails → a boundary can be derived).

## The full chain this completes

```
רחל → CSV → Observation Contract → Canonical Identity → Evidence
     → Boundary Engine → Next Experiment → הניסוי הבא
```

This is no longer a system that stores data. It manages the lab's **learning cycle**.

## Acceptance run (do this once, with real data — then stop and evaluate)

1. **Export** — Rachel fills the lab template and exports a CSV
   (`docs/observation-template.csv` is the shape; `first-boundary-plaster-*.csv` are worked examples).
2. **Upload** — open `/boundary-dashboard?token=<JWT>`, click **⬆ העלאת תצפיות (CSV)**.
3. **Preview** — confirm the dry-run counts make sense (valid/rejected/new identities),
   then approve.
4. **Ingest** — observations land; the summary shows contradictions + boundary candidates.
5. **Result** — either a **first boundary is derived** (chart shows boundary ±CI) **or**
   the system honestly says *not enough data yet* (no bracketing: missing Works or Fails).
6. **Next experiment** — `GET /api/next-experiments` proposes the highest-information run.

If this cycle runs on real lab data, the architecture is not just built — it **works**.
Only then expand capabilities.

## Status of the prerequisite

The ingest endpoints are live and validated; they are **inert against production until
migration 007 (observations table) runs** — a human-gated decision (schema reconciliation,
Option C — see `docs/SCHEMA-RECONCILIATION-DECISION.md`). The Preview step, however, works
today against the local canonical Axis Authority, so Rachel can validate a CSV before 007
ever lands.
