-- ============================================================================
-- 014 — Schema reconciliation, Option C (LAYER). DRAFT — DO NOT RUN until a human
-- picks the option (see docs/SCHEMA-RECONCILIATION-DECISION.md).
-- Keeps `measurements` as the event; makes `observations` the canonical value rows
-- linked to it; normalizes `outcomes` named columns into canonical-axis observations.
-- ============================================================================

-- 1. Link observations to the measurement event (provenance lives in measurements).
ALTER TABLE observations ADD COLUMN IF NOT EXISTS measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS observations_measurement_idx ON observations(measurement_id);

-- 2. Review view: emit canonical-axis observation rows from outcomes' wide columns,
--    so the team can verify the normalization BEFORE writing rows.
CREATE OR REPLACE VIEW outcomes_as_observations AS
  SELECT o.measurement_id, 'ph'::text AS axis_id, o.ph::numeric AS value, ''::text AS unit
    FROM outcomes o WHERE o.ph IS NOT NULL
  UNION ALL
  SELECT o.measurement_id, 'density'::text AS axis_id, o.specific_gravity::numeric AS value, 'kg/m3'::text AS unit
    FROM outcomes o WHERE o.specific_gravity IS NOT NULL;

-- 3. (After review) INSERT ... SELECT from the view into observations with axis FK +
--    provenance derived from measurements. Left commented — run after human sign-off.
-- INSERT INTO observations (project_id, measurement_id, axis_id, value, unit, method, conditions, provenance)
-- SELECT ... FROM outcomes_as_observations v JOIN measurements m ON m.id = v.measurement_id;
