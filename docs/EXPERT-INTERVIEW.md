# Expert Interview — the parallel evidence stream (David)

The bottleneck is **not** only Rachel's Gold Standard. The expert interview with David produced
verified operational engineering knowledge that **does not exist in the document corpus**
(Identity Gate, Material Authority, Premix, Formula ≠ Recipe, PSD Design, Production Strategy,
Manufacturing Response, Dry-Powder QC philosophy, Engineering Playbook rules).

So MATRIYA runs **three first-class knowledge sources in parallel** (`config/evidence_streams_v1.json`):

| | Document Knowledge | Experimental Knowledge | Operational Knowledge |
|---|---|---|---|
| Question | what is written | what is measured | how Fresco actually works |
| Source | Reference Corpus | lab runs (E-012…) | operational interviews |
| Validator | **Rachel** | Lab (pre-registered) | **David** |
| Knowledge types | declarative, procedural | declarative | engineering |
| Feeds | Materials / SOP / Requirement | Experiment / Knowledge Graph | Engineering Playbook / Knowledge Model |
| Gate | document fan-out → Gold Standard | coupling promotion | **does not wait — via David** |

The **Operational Knowledge** stream is the unique asset — it cannot be extracted from
documents. **Do not pause it waiting for Rachel.**

## Four classes of operational knowledge
Each insight is classified (`config/engineering_playbook_v1.json#knowledge_classes`):
- **Engineering Principle** — PSD is part of the formula.
- **Production Strategy** — buy fractions, assemble PSD in-house.
- **Operational Rule** — don't compensate for out-of-spec raw material.
- **Decision Heuristic** — QC deviation → investigate raw materials.

## How operational knowledge enters — ONE question at a time
Not a batch. Each question spawns 5–10 unexpected insights, so depth beats breadth:
```
Question → Discussion → Model Update → Next Question
```
1. Take the `active_question` from `config/expert_interview_queue_v1.json`.
2. **Ask David directly; discuss** (follow the threads it opens).
3. The answer becomes a verified `engineering_rule` / `knowledge_model` entity, tagged
   `source: David · source_type: operational_knowledge · knowledge_class: <one of 4> ·
   validation_status: verified`, with a **confidence_scope**:
   ```yaml
   confidence_scope:
     verified_for:    [Dry Powder]
     not_verified_for: [Liquid Systems]
     future_validation: [Finish Coatings]
   ```
4. Update the model, then advance `active_question`. Never generalize beyond the stated scope.

## Open questions now (see queue for full text)
Q-001 scope beyond dry powder/B-4 · Q-002 identity reject tolerances · Q-003 quantitative Premix
fitness · Q-004 adjust→retest limits + levers · Q-005 which process vars predict performance ·
Q-006 workability spec + 15-batch cadence · Q-007 supplier qualification entry criterion ·
Q-008 which Playbook rules generalize · Q-009 formula versioning when Premix/PSD changes.

These are the fastest way to grow the engineering model — independent of document validation.
