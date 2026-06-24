-- ============================================================================
-- 007 — Observation Contract + Axis Authority  (Boundary Intelligence, Phase 0)
-- Run in MANAGEMENT system Supabase (same DB as projects, materials,
-- lab_experiments, analysis_log).
--
-- This migration implements ONLY the irreversible core needed before E-011:
--   1. axes         — Axis Authority (commensurability registry)
--   2. observations — the Observation Contract (append-only evidence points)
--
-- It deliberately does NOT create a boundary table. Per LAW-BOUNDARY-001:
--   "Boundaries are never stored. Only observations are stored.
--    Boundaries emerge from structured aggregation over canonical axes."
-- Boundary inference, navigation and coverage metrics are out of scope until
-- E-011 validates the thesis.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. AXES — Axis Authority
-- An axis is NOT a name. It is a commensurability key: two measurements may be
-- compared (aggregated into a boundary) ONLY if they share dimension + unit +
-- method. Name-only collapse (APP / app / APP%) is unsafe; unit/method collapse
-- (%w/w vs %v/v, RH% vs g/m3) is silently corrupting. This table is the
-- canonical identity of the coordinate system on which every boundary is built.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS axes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  axis_id         TEXT UNIQUE NOT NULL,            -- canonical id, e.g. 'EXPANSION'
  name            TEXT NOT NULL,                   -- human label
  dimension       TEXT NOT NULL,                   -- physical quantity, e.g. 'expansion_ratio'
  canonical_unit  TEXT NOT NULL,                   -- the ONLY comparable unit, e.g. '%w/w'
  method          TEXT NOT NULL,                   -- measurement method / instrument
  is_scalar       BOOLEAN NOT NULL DEFAULT TRUE,   -- composites (e.g. PSD) must be decomposed to scalar axes (D10/D50/D90)
  aliases         JSONB NOT NULL DEFAULT '[]',     -- name synonyms only — NOT unit/method synonyms
  noise_floor     NUMERIC,                         -- MME for THIS axis+method (axis-and-method specific). E-011 uses 1.44.
  outcome_spec    JSONB,                           -- pre-registered Works/Borderline/Fails thresholds on `value`
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS axes_axis_id_idx ON axes(axis_id);

-- An axis must be scalar (the granulometry/MEL trap, one layer deeper).
ALTER TABLE axes DROP CONSTRAINT IF EXISTS axes_scalar_only;
ALTER TABLE axes ADD CONSTRAINT axes_scalar_only CHECK (is_scalar = TRUE);

COMMENT ON TABLE axes IS 'Axis Authority: canonical {dimension, unit, method}. Defines when two observations may be aggregated into a boundary.';
COMMENT ON COLUMN axes.noise_floor IS 'Minimum Meaningful Effect for this axis+method; a Δ below it is noise, not a boundary.';
COMMENT ON COLUMN axes.outcome_spec IS 'Pre-registered classification thresholds (e.g. {"fails_below": x}); set by lab head (Personal Veto), not invented by code.';

-- ----------------------------------------------------------------------------
-- 2. OBSERVATIONS — the Observation Contract
-- The single irreversible component. Context not captured at observation time
-- cannot be reconstructed later. Therefore: capture wide, condition narrow.
-- Append-only: observations are permanent; boundaries are derived from them.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (Identity Before Aggregation): canonical keys only.
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  experiment_id   UUID REFERENCES lab_experiments(id) ON DELETE SET NULL,  -- identity anchor (encouraged)
  material_id     TEXT REFERENCES materials(material_id) ON DELETE SET NULL, -- canonical subject material; FK forces materials, not material_library name

  -- Axis (the RESPONSE measured, e.g. EXPANSION). Inputs like APP loading live in `conditions`.
  axis_id         TEXT NOT NULL REFERENCES axes(axis_id),
  value           NUMERIC NOT NULL,               -- the empirical point
  unit            TEXT NOT NULL,                  -- captured-as unit; must equal axes.canonical_unit (enforced by validator)
  method          TEXT NOT NULL,                  -- captured-as method; must equal axes.method (enforced by validator)

  -- Uncertainty (needed to tell a boundary from noise vs axes.noise_floor).
  uncertainty     NUMERIC,                        -- measurement std / error
  replicate_count INTEGER NOT NULL DEFAULT 1,
  replicate_group TEXT,                           -- groups replicates of the same point

  -- Context (capture wide): controlled conditions, ideally keyed by canonical axis_id,
  -- e.g. {"APP_LOADING":{"value":28,"unit":"%w/w"},"TEMPERATURE":{"value":23,"unit":"C"}}.
  -- Open/extensible by design — never store a fixed closed set (Boundary Without Context Is Invalid).
  conditions      JSONB NOT NULL DEFAULT '{}',

  -- Evidence / Provenance (Evidence Before Boundary): where this point came from.
  provenance      JSONB NOT NULL,                 -- {source_type, source_reference, observed_by, observed_at}

  -- Outcome (asserted against a pre-registered spec; raw `value` is always kept so it is re-derivable).
  outcome_class   TEXT CHECK (outcome_class IS NULL OR outcome_class IN ('works','borderline','fails')),
  outcome_spec_ref TEXT,                          -- which spec/version classified it (auditability)

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS observations_project_idx     ON observations(project_id);
CREATE INDEX IF NOT EXISTS observations_axis_idx        ON observations(axis_id);
CREATE INDEX IF NOT EXISTS observations_material_idx    ON observations(material_id);
CREATE INDEX IF NOT EXISTS observations_experiment_idx  ON observations(experiment_id);
CREATE INDEX IF NOT EXISTS observations_conditions_idx  ON observations USING GIN (conditions);

COMMENT ON TABLE observations IS 'Observation Contract: append-only empirical points. The only irreversible component; missing context cannot be recovered.';
COMMENT ON COLUMN observations.axis_id IS 'The response axis measured. Controlled inputs (e.g. APP loading) belong in conditions.';
COMMENT ON COLUMN observations.conditions IS 'Capture wide: store all conditions (even non-critical). Boundaries condition narrow on the critical subset later.';

-- ----------------------------------------------------------------------------
-- 3. Observations are PERMANENT (Principle 5). Block UPDATE/DELETE at the DB.
-- Corrections are made by appending a new observation, never by mutating one.
-- (Decision-time "frozen derivations" are a future table, not this one.)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION observations_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'observations are append-only (Principle 5: Observations Are Permanent). Append a correcting row instead of % .', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS observations_no_mutate ON observations;
CREATE TRIGGER observations_no_mutate
  BEFORE UPDATE OR DELETE ON observations
  FOR EACH ROW EXECUTE FUNCTION observations_append_only();

-- ----------------------------------------------------------------------------
-- 4. Seed the single axis needed for E-011.
-- NOTE: canonical_unit, method and outcome_spec below are PLACEHOLDERS pending
-- the lab head's pre-registration (Personal Veto). noise_floor = 1.44 (MME).
-- ----------------------------------------------------------------------------
INSERT INTO axes (axis_id, name, dimension, canonical_unit, method, is_scalar, noise_floor, outcome_spec)
VALUES (
  'EXPANSION',
  'Expansion ratio',
  'expansion_ratio',
  'x',                       -- TODO(lab): confirm canonical unit (ratio 'x' vs '%')
  'free_expansion_test',     -- TODO(lab): confirm exact method/instrument
  TRUE,
  1.44,                      -- MME for EXPANSION under this method
  NULL                       -- TODO(lab): pre-register Works/Borderline/Fails thresholds before E-011
)
ON CONFLICT (axis_id) DO NOTHING;

-- ============================================================================
-- Done. Next (Level-0 items 2 & 3): ingest endpoint that routes EVERY write
-- through lib/observationContract.js, and the E-011 pre-registration doc.
-- ============================================================================
