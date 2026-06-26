# Expert Interview — the parallel evidence stream (David)

The bottleneck is **not** only Rachel's Gold Standard. The expert interview with David produced
verified operational engineering knowledge that **does not exist in the document corpus**
(Identity Gate, Material Authority, Premix, Formula ≠ Recipe, PSD Design, Production Strategy,
Manufacturing Response, Dry-Powder QC philosophy, Engineering Playbook rules).

So MATRIYA runs **two first-class evidence streams in parallel** (`config/evidence_streams_v1.json`):

| | Document stream | Expert stream |
|---|---|---|
| Source | Reference Corpus | Expert interviews |
| Validator | **Rachel** | **David** |
| Authority domain | document interpretation | operational engineering model |
| Knowledge types | declarative, procedural | engineering |
| Feeds | Materials / SOP / Requirement | Engineering Playbook / Knowledge Model / Authority Layers |
| Gate | document fan-out waits for Gold Standard | **does not wait — proceeds via David** |

**Do not pause the expert stream waiting for Rachel.** Rachel validates *how documents are read*;
David provides the *engineering model behind them*. Different authority domains, both first-class.

## How expert knowledge enters
1. A question is raised (production philosophy, raw-material qualification, engineering decision,
   manufacturing strategy) → added to `config/expert_interview_queue_v1.json`.
2. **Ask David directly.**
3. His answer becomes a verified `engineering_rule` (Engineering Playbook) or a `knowledge_model`
   entity, tagged `source: David · source_type: expert_operational_knowledge ·
   validation_status: verified · scope: <as David states>` (+ falsifier where one exists).
4. Never generalize beyond the scope David states.

## Open questions now (see queue for full text)
Q-001 scope beyond dry powder/B-4 · Q-002 identity reject tolerances · Q-003 quantitative Premix
fitness · Q-004 adjust→retest limits + levers · Q-005 which process vars predict performance ·
Q-006 workability spec + 15-batch cadence · Q-007 supplier qualification entry criterion ·
Q-008 which Playbook rules generalize · Q-009 formula versioning when Premix/PSD changes.

These are the fastest way to grow the engineering model — independent of document validation.
