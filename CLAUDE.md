# CLAUDE.md — maneger-back

Guidance for Claude Code (and any AI agent) working in this repository. Read this before making changes.

## What this project is

**maneger-back** is the backend for the Maneger project-management / "Lab Control" system. It is an autonomous service that integrates with Matriya **through its API only** (no shared database).

- **Runtime:** Node.js 18+, **ESM** (`"type": "module"` — use `import`/`export`).
- **Framework:** Express.js 4.18.2.
- **Database:** Supabase (PostgreSQL) via `@supabase/supabase-js` and the `pg` pooler. Schema in `supabase_schema.sql`.
- **Validation:** Zod schemas (e.g. `runCreateSchema`, `taskPatchSchema`).
- **Other:** Multer (uploads, 50MB), `express-rate-limit`, Axios (for proxying to Matriya/OpenAI), file parsers (`pdf-parse`, `mammoth`, `xlsx`).
- **External services:** Matriya (auth/research, via `MATRIYA_BACK_URL`), OpenAI (embeddings + RAG file_search), optional SharePoint (Microsoft Graph) and Resend (email).
- **Language:** plain JavaScript. No TypeScript — do not add it.
- **Entry point:** `server.js` — a **~5,600-line monolith**. Edit the relevant section in place; do not attempt a wholesale rewrite or split unless that is the explicit task.

## How to run, build, and verify

```bash
npm run dev    # node --watch server.js  (dev, auto-reload)
npm start      # node server.js           (production)
npm test       # node scripts/verify-david-checklist.mjs  (the only automated check)
```

There is **no build step** and **no linter**. `npm test` runs a single checklist script (`verify-david-checklist.mjs`) covering lab import, email, inbound project routing, and vector cleanup — it is **not** a full test suite. When you change those areas, run it and report the real output. For anything it doesn't cover, verify by exercising the actual endpoint.

## Existing enforcement rules — these are load-bearing, do not break them

This repo documents hard rules in `ARCHITECTURE.md`, `ENFORCEMENT.md`, and `INFRASTRUCTURE.md`. Read them before touching auth, task status, or data endpoints.

- **RBAC** (`ENFORCEMENT.md`): every project-data endpoint must go through `requireProjectMember(req, res, projectId)`. Return **401** if unauthenticated, **403** if not a member. Owner-only operations (project update/delete, member management, join-request approve/reject) must check `role === 'owner'`. Don't add data endpoints that skip this guard.
- **Audit log** (`ENFORCEMENT.md`): every create/update/delete writes to `audit_log` with `user_id`, `username`, `action`, `entity_type`, `entity_id`, and `details` (JSONB). Task status updates must record a before/after diff: `details: { before: { status }, after: { status } }`. Keep new mutations audited.
- **Task-status FSM** (`ENFORCEMENT.md`): validate transitions **before** the DB write; return **409** with `{ error, invalid_transition: true, from, to }` on invalid ones. Valid: `todo → in_progress|cancelled`; `in_progress → todo|in_review|cancelled`; `in_review → in_progress|done|cancelled`; `done`/`cancelled` are terminal.
- **Infrastructure** (`INFRASTRUCTURE.md`): rate limits (auth 20/min, upload 15/min, general 200/min); JSON body 1MB; file upload 50MB; list endpoints paginate with `?limit=50&offset=0` (max 100); requests tracked via `x-request-id`. Validate inputs with Zod.
- **Matriya integration is API-only** (`ARCHITECTURE.md`): never assume a shared DB with Matriya; go through `MATRIYA_BACK_URL`.

## Configuration

Secrets from `.env` (see `.env.example`). Key vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, `OPENAI_API_KEY`, `MATRIYA_BACK_URL`, optional `SHAREPOINT_*` / `RESEND_*`, and rate-limit tuning vars. Never hardcode or commit secrets.

## Working agreement (the important part)

1. **Don't over-engineer.** Make the smallest change that fits the monolith's existing patterns. No new frameworks, no TypeScript, no speculative abstractions, no dependencies unless the task truly needs them and you've justified it.
2. **Follow instructions and the enforcement rules above.** New endpoints must respect RBAC, audit logging, the FSM, pagination, rate limits, and Zod validation. ESM, camelCase functions, UPPER_CASE constants. If a request would violate a documented rule, stop and flag it rather than silently complying.
3. **Don't claim done until it's verified.** "Done" means the code runs and the relevant check (`npm test` and/or the actual endpoint) passed. If you couldn't verify, say so explicitly and why — never report success on unrun code.
4. **Don't invent APIs.** The endpoint logic lives in `server.js`; the data model lives in `supabase_schema.sql`. Confirm table names, columns, route paths, and helper functions by reading them before use. Don't guess Supabase columns, Zod schema fields, or Express middleware that may not exist.
5. **Surface uncertainty.** For ambiguous requests, large/risky changes, or anything that touches RBAC/audit/FSM, ask or flag before proceeding.

## Git

- Develop on branch `claude/new-session-ydal7p`.
- Clear, descriptive commit messages. Do not open a PR unless explicitly asked.
- Never commit secrets or `.env`.
