# AGENTS.md

Canonical instructions for AI coding agents working on RescueAI. Read this first on every task.

> **Project state (2026-09-18): scaffolded, no features.** The repository is a git repository with the documentation set plus two empty packages, `web/` and `api/`. Both build, lint, type-check and run one trivial test. `docker compose up` serves the SPA and `/api/health` from one origin. It deploys to Render (free) with Neon PostgreSQL (D-044). GitHub Actions runs the checks on every pull request. **No PRD feature (F1-F14) is implemented and no database table exists yet.** Any section below that says **Not established** must be filled in, in the same change that establishes it.

## Project Overview

RescueAI is a web-based decision support system for the response phase of a disaster. Citizens submit rescue requests. The system ranks the requests and recommends verified volunteers and SDRF/NDRF rescue teams, with an explanation for each recommendation. Before anything is dispatched, an on-site commander selects the responders and an office commander approves the selection. It is a B.Tech final-year project (team CSE27-364, GEHU).

- The requirements, MVP scope, user flows and acceptance criteria are in **`PRD.md`**. That file is the source of truth for *what* to build.
- Deadlines (department timeline, see `PLAN.md`): Phase-I Examination Oct 26 – Nov 3, 2026; deployed prototype plus evaluation results by January 2027; Final Report April 2027; Phase-II Examination May 2027.
- `PRD.md` is still a **draft with open assumptions** (see its last section). Do not treat an item marked `[Assumption]` as confirmed. Items marked `[Provisional]` are decided for now but must be reconsidered against scenario data; don't present them as final.

## Architecture Overview

The architecture is **partly built**: the three deployable pieces run and are live, but no feature behind them exists. Full details, diagrams and decision status are in **`ARCHITECTURE.md`**. Read it before any structural change.

In short:
- A React SPA (Vite, Tailwind, shadcn/ui, TanStack Query, Leaflet), installable as a PWA.
- A Node.js + Express API in strict TypeScript, with zod validation and Drizzle ORM on PostgreSQL (no PostGIS).
- Server-side session cookies for login.
- Live updates by polling every ~5 s.
- Deployed as one Docker image (API serving the built SPA from the same origin) on Render, with Neon PostgreSQL (D-044). Docker Compose is the local stack.
- MVP ranking uses the PRD formulas with straight-line distance and no ML.

Anything still marked **Proposed** in `ARCHITECTURE.md` (currently only AD11, the future Python ML service) needs the user's confirmation before you rely on it.

## Repository Structure

Existing:
```
README.md        Public overview: what it is, how to run it, where the docs are
LICENSE          MIT
PRD.md           Product requirements (source of truth for scope and acceptance criteria)
DESIGN.md        Design system (read before any UI work)
ARCHITECTURE.md  Architecture, stack, boundaries and decisions
RULES.md         Coding rules (read before writing code)
MEMORY.md        Current project state and session handoff (read at session start)
DECISIONS.md     Decision log (append-only; supersede, never rewrite)
TESTING.md       Testing strategy, required tests, Definition of Done
PLAN.md          Seven-phase delivery plan: dates, scope and exit criteria per phase (Proposed)
AGENTS.md        This file
CLAUDE.md        Points to this file
```

Also existing (created 2026-09-18, Phase 1 scaffold; no features yet):
```
web/                   React SPA (Vite, Tailwind v4, shadcn/ui, TanStack Query)
  src/index.css        Design tokens from DESIGN.md. Change a token here, never per component.
  src/components/ui/   shadcn/ui components, added with the shadcn CLI
  src/lib/utils.ts     cn() class merge helper
  components.json      shadcn CLI config (slate base, CSS variables, @/* alias)
api/                   Express API (strict TypeScript)
  src/app.ts           Express app: /api/health, 404 and error handler in the D-035 shape
  src/routes/          empty - HTTP handlers land in Phase 2
  src/services/        empty - business rules land in Phase 2
  src/scoring/         empty - pure ranking functions land in Phase 2
  src/db/              Drizzle client; schema.ts is an empty placeholder until Phase 2
  drizzle.config.ts    drizzle-kit config (migrations output to api/drizzle/)
Dockerfile             Builds web/ and api/ into one image. This is the deployed unit.
docker-compose.yml     db + app, building that same Dockerfile. Local stack.
render.yaml            Render service definition. DATABASE_URL is set in the dashboard.
neon.ts                Neon branch policy, applied with `neon deploy` (D-045)
package.json           Root manifest for the Neon CLI only - NOT a workspace. Put
                       application dependencies in web/ or api/ (D-043, D-045).
.claude/skills/        Neon agent skills, installed by `neon skills`
.env.example           Copy to .env for docker compose. POSTGRES_PASSWORD is required.
.env.local             Written by `neon link`. Holds the real DATABASE_URL.
                       Git-ignored - it is a secret, never commit it.
.github/workflows/ci.yml  Lint, type-check and tests for both packages on every PR
disasterIND.csv        EM-DAT India disaster records (783 rows), reference data for scenarios
```

The `disasterIND.csv` dataset is reference material only. Scenario data loaded through the app must be synthetic (`RULES.md` -> Database Rules).

## Development Commands

npm only. `web/` and `api/` are separate packages with their own `package-lock.json`; there is no workspace root. Run `npm install` in each once.

| Where | Command | What it does |
|---|---|---|
| `api/` | `npm run dev` | API with reload on `http://localhost:3000` |
| `web/` | `npm run dev` | SPA on `http://localhost:5173`, proxying `/api` to port 3000 |
| `web/` | `npm run format` / `npm run format:check` | Prettier |
| `api/` | `npm run format` / `npm run format:check` | Prettier |
| repo root | `cp .env.example .env` then `docker compose up --build` | Whole stack on `http://localhost:3000` - the same image Render deploys |
| repo root | `docker compose down` | Stop it. Add `-v` to also drop the database volume. |
| `api/` | `node --env-file=../.env.local --import tsx src/index.ts` | Run the API against the **real Neon** `production` branch instead of the local container |
| repo root | `neon config plan` | Preview what `neon deploy` would change on the linked branch |

Deployed at <https://rescueai-70mu.onrender.com>, auto-deploying from `main`. The Neon project is `super-hill-50061651`, branch `production`, linked on 2026-09-18 (D-045). Never print or paste a connection string into a file, a log or a commit; pass `.env.local` with `--env-file` instead.

`api/npm run db:generate` and `api/npm run db:migrate` wrap drizzle-kit. They do nothing useful until the Phase 2 schema exists.

## Build Commands

| Where | Command | Output |
|---|---|---|
| `api/` | `npm run build` | Compiled JS in `api/dist/`; `npm start` runs it |
| `web/` | `npm run build` | Static SPA in `web/dist/`; the image copies it to `./public`, which Express serves |
| repo root | `docker compose build` | The deployed image: SPA + API in one |

## Testing Commands

| Where | Command | What it runs |
|---|---|---|
| `api/` | `npm test` | Vitest, `api/src/**/*.test.ts` |
| `web/` | `npm test` | Vitest, `web/src/**/*.test.ts` |
| `api/` | `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `web/` | `npm run lint` / `npm run typecheck` | ESLint / `tsc -b --noEmit` |

Integration tests against Docker PostgreSQL do not exist yet; their harness lands in Phase 2. See `TESTING.md` for the strategy and the Definition of Done.

## Code Conventions

All coding rules are in **`RULES.md`**: naming, strict TypeScript, layering, error handling, state management, git and the list of forbidden practices. Read it before writing code.

## Architecture Conventions

- **Build only MVP features F1–F14 from `PRD.md`.** Anything under PRD "Future Features" or "Non-Goals" is out of scope unless the PRD is updated first.
- **Scoring weights must be configurable.** w1–w4, α, β and γ are changed by the Admin without a code change or redeploy (PRD F7, AC10).
- **Explanations must add up.** Each recommendation's per-feature contributions must sum to its displayed score (PRD F8, AC9).

## Database Conventions

The database is PostgreSQL, accessed through Drizzle ORM with drizzle-kit migrations. The entities and data-model rules are in `ARCHITECTURE.md` → Database Architecture. The migration and audit rules are in `RULES.md` → Database Rules.

## API Conventions

See `ARCHITECTURE.md` → API Architecture and `RULES.md` → API Rules.

## Security Requirements

These rules are decided in `PRD.md`:
- **Role-based access control** per PRD AC18. Citizens can reach only the request form. Volunteers cannot see the queue, unassigned requests or other volunteers' locations. Only the Admin creates commander accounts or changes weights.
- **Passwords are stored hashed.**
- **Personal data is restricted to commanders.** Citizen phone numbers and volunteer locations are visible only on the commander (SDRF/NDRF) dashboards. Volunteers (including the assigned volunteer) and the Admin never receive them, and audit snapshots and CSV exports leave them out (AC14, AC18, AC20).
- **Human in the loop, at two levels.** No code path may create an offer or deploy a team unless an on-site commander's logged selection has been approved by an office commander, and that approval is also logged (AC11, AC22).

How these are implemented: `ARCHITECTURE.md` → Security Architecture and `RULES.md` → Security Rules.

## Dependency Guidelines

- Use npm only.
- Use the adopted tool for each job (see `RULES.md` → Dependency Rules).
- Get the user's approval before adding a new framework, database or external service.

## Testing Requirements

- Each MVP feature is done only when the acceptance criteria it covers in `PRD.md` (AC1–AC25) are verified.
- The required tests, the checks to run, and the Definition of Done are in **`TESTING.md`**. Follow it before reporting any task complete.

## Verification Checklist

Before reporting a task complete:
1. The change is within MVP scope (PRD F1–F14) and satisfies the relevant acceptance criteria.
2. Every commander approval rule, audit-log rule and access rule in "Security Requirements" still holds.
3. Lint, type-check and tests pass once they exist. Every command or test you claim to have run was actually run, and you report its real output.
4. The change follows `RULES.md`, and follows `DESIGN.md` if it touches UI.
5. If you added or changed a command, dependency, directory or convention, you updated this file (or `RULES.md`) in the same change.
6. If you made a major architectural change (a new service, datastore, boundary, or change of stack), you updated `ARCHITECTURE.md` in the same change. If you made or changed a significant decision, you added a `DECISIONS.md` entry, superseding the old entry rather than rewriting it.
7. After a meaningful session, update `MEMORY.md` (status, open problems, next steps) and remove anything in it that is out of date.

## Forbidden Changes

- Do not add autonomous dispatch, or any bypass of either approval level (on-site selection or office approval).
- Do not make audit-log entries editable or deletable, through any UI, API or migration.
- Do not implement PRD Future Features or Non-Goals (for example routing, ML models, RAG, chatbot, hospitals and shelters, push notifications, native app, offline mode) without a PRD update.
- Do not treat `[Assumption]` items in `PRD.md`, or Proposed items in `ARCHITECTURE.md`, as settled. Do not silently change them.
- Do not document commands, tools or conventions in this file that do not actually exist in the repo.
- Coding-level prohibitions are listed in `RULES.md` → Forbidden Practices.

## Additional Documentation

- `PRD.md` covers product scope, roles, features F1–F14, user flows, constraints, success metrics and acceptance criteria.
- `DESIGN.md` covers colors, typography, layout, component patterns, states and accessibility (WCAG 2.2 AA). **Read it before creating or modifying any UI.**
- `ARCHITECTURE.md` covers the stack, layers, data model, API areas, data flow, system boundaries, security implementation, deployment, and decision status (Decided or Proposed).
- `RULES.md` covers the coding rules: organization, naming, types, errors, API, database, security, dependencies, state, testing, git, performance, and forbidden practices.
- `MEMORY.md` covers the current state, known problems, next steps and session handoff. **Read it at the start of every session.**
- `DECISIONS.md` is the decision log (D-001 onward): context, options, reasoning and trade-offs for each product and technical decision.
- `TESTING.md` is the testing strategy: the stack, which layer needs which kind of test, mocking and test-data rules, required checks, and the Definition of Done.
- The project synopsis (`Synopsis_CSE27-364.pdf`) is the background research and full long-term vision. It is **not in this repository**. `PRD.md` overrides it on scope.
