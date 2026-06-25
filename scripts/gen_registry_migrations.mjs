import fs from 'fs'; import path from 'path';
const here = path.dirname(new URL(import.meta.url).pathname);
const rd = f => JSON.parse(fs.readFileSync(path.resolve(here,'../config/'+f),'utf8'));
const esc = s => String(s).replace(/'/g,"''"); const j = o => esc(JSON.stringify(o));
const cp = rd('coupling_registry_v1.json');
const cpRows = cp.couplings.map(c=>`  ('${esc(c.id)}','${esc(c.a)}','${esc(c.b)}','${esc(c.dir)}','${esc(c.domain)}','${esc(c.mechanism)}','${esc(c.verify)}','${esc(c.level)}','${esc(c.falsifier)}')`).join(',\n');
fs.writeFileSync(path.resolve(here,'../migrations/012_couplings.sql'),
`-- 012 — Coupling registry (property-vs-property trade-off/synergy boundaries)
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
${cpRows}
ON CONFLICT (coupling_id) DO NOTHING;
`);
const mh = rd('mechanism_hypothesis_seed_v1.json');
const mhRows = mh.rows.map(r=>`  ('${esc(r.property)}','${esc(r.layer)}','${j(r.levers)}'::jsonb,'${esc(r.mechanism)}','${esc(r.evidence_ref.metric)}',${r.evidence_ref.experiment_count},'${esc(r.to_verify)}','HYPOTHESIS')`).join(',\n');
fs.writeFileSync(path.resolve(here,'../migrations/013_mechanism_hypotheses.sql'),
`-- 013 — Mechanism hypotheses (K-stage; status HYPOTHESIS until a controlled to_verify is bound)
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
${mhRows};
`);
console.log('generated migrations 012 (',cp.couplings.length,'couplings ) and 013 (',mh.rows.length,'mechanisms )');
