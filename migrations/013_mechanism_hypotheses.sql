-- 013 — Mechanism hypotheses (K-stage; status HYPOTHESIS until a controlled to_verify is bound)
-- GENERATED from config/mechanism_hypothesis_seed_v1.json (David). Additive; not run.
CREATE TABLE IF NOT EXISTS mechanism_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property TEXT NOT NULL, layer TEXT,
  levers JSONB NOT NULL DEFAULT '[]',
  mechanism TEXT, evidence_metric TEXT, evidence_experiment_count INTEGER,
  to_verify TEXT,
  status TEXT NOT NULL DEFAULT 'HYPOTHESIS' CHECK (status IN ('HYPOTHESIS','PARTIAL','VERIFIED')),
  created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO mechanism_hypotheses (property,layer,levers,mechanism,evidence_metric,evidence_experiment_count,to_verify,status) VALUES
  ('EXPANSION','L1','["APP(up)","PER(up)","MEL(up)","Nanoclay(up)","Binder(down)"]'::jsonb,'Intumescent triad: APP releases phosphoric acid catalyzing PER charring; MEL releases NH3/CO2 expanding the char into insulating foam; binder dilutes the triad; nanoclay reinforces cell walls.','expansion_ratio',16,'Hold base fixed; vary APP alone in 3 steps; measure expansion_ratio. Directional+isolated -> VERIFIED. Repeat per lever.','HYPOTHESIS'),
  ('FIRE_DRY','L1','["APP(up)","MEL(up)","PER(up)","Binder(down)"]'::jsonb,'Intumescent char (same triad) forms a low-conductivity foamed barrier insulating the substrate and delaying its temperature rise.','IFR',3,'EN 13381-8 / cone on a controlled APP-only and MEL-only ladder. Only 3 experiments -> weak base, expand first.','HYPOTHESIS'),
  ('CHAR_QUAL','L1','["PER(up)","Nanoclay(up)","APP(up)"]'::jsonb,'Char quality (cohesion/density/adhesion of residue) set by carbon source PER and reinforced by nanoclay platelets bridging the char; APP supplies crosslinking acid. Poor char = too little PER/nanoclay vs blowing.','char_quality',12,'Vary nanoclay alone; score char by rubric; check cohesion/crack resistance tracks nanoclay.','HYPOTHESIS'),
  ('ADHES_DRY','L1','["Binder(up)","ENCOR(up)","APP(down)"]'::jsonb,'Binder wets substrate and forms the interfacial bond; high APP filler load dilutes binder at the interface and introduces weak boundary layers -> high APP lowers adhesion.','adhesion',15,'Pull-off D4541 across a binder-fraction ladder at fixed APP; then APP-only ladder for the dilution effect.','HYPOTHESIS'),
  ('VISC_WET','L2','["RM-825(up)","Xanthan(up)","Cellulose(up)","Nanoclay(up)","OROTAN(down)","Water(down)"]'::jsonb,'Wet viscosity built by the rheology-modifier network: RM-825 associative bridging; Xanthan/Cellulose H-bonded networks; nanoclay house-of-cards. OROTAN de-flocculates; water lowers solids.','viscosity',12,'Brookfield across an RM-825-only ladder at fixed solids; confirm monotonic rise.','HYPOTHESIS');
