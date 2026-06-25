-- 012 — Coupling registry (property-vs-property trade-off/synergy boundaries)
-- GENERATED from config/coupling_registry_v1.json (E-010, David). Additive; not run.
-- 0/15 Verified = the E-011 experiment map. Each carries a Popperian falsifier.
CREATE TABLE IF NOT EXISTS property_couplings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupling_id TEXT UNIQUE NOT NULL,
  property_a TEXT NOT NULL, property_b TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('-','+','~')),
  domain TEXT, mechanism TEXT, verify_method TEXT,
  evidence_level TEXT CHECK (evidence_level IN ('Verified','Mechanistic','Catalog-supported','Hypothesis')),
  falsifier TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO property_couplings (coupling_id,property_a,property_b,direction,domain,mechanism,verify_method,evidence_level,falsifier) VALUES
  ('C01','Capillary','Adhesion','-','Siloxane/Silane','low surface energy -> low wetting and low overcoat adhesion','pull-off EN ISO 4624 of overcoat on treated vs untreated','Mechanistic','a hydrophobic formulation whose overcoat adheres >= control'),
  ('C02','Breathability','Flexibility','-','Acrylic/PU film','continuous low-Tg film lowers vapor permeability','binder series: Sd (EN ISO 7783) vs elongation (EN 1062-7) -> Pareto','Mechanistic','flexible film with low Sd like mineral'),
  ('C03','Breathability','Fire','-','Intumescent','thick dense intumescent char raises Sd','Sd before/after intumescent layer at standard thickness','Mechanistic','intumescent system with low Sd'),
  ('C04','Flexibility','Fire','-','Intumescent','rigid/brittle char structure','elongation of intumescent vs elastomeric film','Mechanistic','intumescent with crack-bridging'),
  ('C05','Flexibility','UV','-','Organic binders','flexible organic binder oxidizes/embrittles','QUV EN ISO 16474: elongation change + dE over time','Mechanistic','flexible binder with low UV decay like mineral'),
  ('C06','Flexibility','Consolidation','-','TEOS/Silicate vs Acrylic','high modulus/stiffness contradicts elastomerity','modulus/drilling-resistance vs elongation','Mechanistic','consolidant that keeps substrate flexibility'),
  ('C07','Fire','UV/Water','-','Intumescent','hydrophilic radiation-sensitive char','QUV + water absorption with/without topcoat','Mechanistic','water/UV-durable intumescent without topcoat'),
  ('C08','Capillary','UV','+','Hydrophobic systems','less water ingress -> less weathering','dE/decay (EN ISO 16474) treated vs untreated','Hypothesis','hydrophobic treatment that accelerates weathering'),
  ('C09','Capillary','Salt','+','Siloxane + render','less water transport -> less salt mobilization','salt crystallization (EN 12370/RILEM) treated vs untreated','Mechanistic','hydrophobe that worsens salt damage'),
  ('C10','Breathability','Salt','+','Porous restoration render','vapor-open -> crystallization in sacrificial render, not at surface','RILEM MS-A1 + crystallization location (face vs depth)','Mechanistic','sealed system that manages salt better'),
  ('C11','Adhesion','Consolidation','+','Silicate/TEOS, NHL','substrate cohesion strengthening -> better anchoring','pull-off on consolidated vs not','Mechanistic','consolidation that reduces adhesion'),
  ('C12','UV','Consolidation','+','Inorganic (silicate)','inorganic systems UV-stable and consolidating','QUV of inorganic consolidating system','Mechanistic','inorganic consolidant that degrades under UV'),
  ('C13','Capillary','Breathability','~','Film vs pore-hydrophobizer','conflict in film-formers; neutral with in-pore hydrophobizer','Sd (EN ISO 7783) + w-value (EN 1062-3) for both technologies','Mechanistic','water-tight film that keeps low Sd'),
  ('C14','Flexibility','Adhesion','~','Elastomeric on rigid','adhesion needed but high film stress causes debonding','cross-cut/pull-off after temperature cycles','Hypothesis','very flexible film with stable cyclic adhesion'),
  ('C15','Consolidation','Salt','~','Deep consolidants','over-consolidation traps salt -> internal spalling','RILEM salt + modulus vs penetration depth','Mechanistic','deep consolidant that improves salt resistance')
ON CONFLICT (coupling_id) DO NOTHING;
