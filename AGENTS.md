# AGENTS.md

Canonical instructions for AI coding agents working on RescueAI. Read this first on every task.

> **Project state (2026-09-11): pre-implementation.** The repository contains only documentation: `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, `RULES.md` and this file. There is no source code, no package manifest, no git repository, no CI and no database yet. Any section below that says **Not established** must be filled in, in the same change that establishes it.

## Project Overview

RescueAI is a web-based decision support system for the response phase of a disaster. Citizens submit rescue requests. The system ranks the requests and recommends verified volunteers and SDRF/NDRF rescue teams, with an explanation for each recommendation. Before anything is dispatched, an on-site commander selects the responders and an office commander approves the selection. It is a B.Tech final-year project (team CSE27-364, GEHU).

- The requirements, MVP scope, user flows and acceptance criteria are in **`PRD.md`**. That file is the source of truth for *what* to build.
- Deadlines (department timeline, see `PLAN.md`): Phase-I Examination Oct 26 – Nov 3, 2026; deployed prototype plus evaluation results by January 2027; Final Report April 2027; Phase-II Examination May 2027.
- `PRD.md` is still a **draft with open assumptions** (see its last section). Do not treat an item marked `[Assumption]` as confirmed. Items marked `[Provisional]` are decided for now but must be reconsidered against scenario data; don't present them as final.

## Architecture Overview

The architecture is **planned, not built**. Full details, diagrams and decision status are in **`ARCHITECTURE.md`**. Read it before any structural change.

In short:
- A React SPA (Vite, Tailwind, shadcn/ui, TanStack Query, Leaflet), installable as a PWA.
- A Node.js + Express API in strict TypeScript, with zod validation and Drizzle ORM on PostgreSQL (no PostGIS).
- Server-side session cookies for login.
- Live updates by polling every ~5 s.
- Deployed on one VM with Docker Compose behind Caddy.
- MVP ranking uses the PRD formulas with straight-line distance and no ML.

Anything still marked **Proposed** in `ARCHITECTURE.md` (currently only AD11, the future Python ML service) needs the user's confirmation before you rely on it.

## Repository Structure

Existing:
```
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

Planned: `web/` (SPA) and `api/` (Express API). They will be created when implementation starts. See `ARCHITECTURE.md` for the planned layout.

## Development Commands

**Not established.** No `package.json` exists yet. The package manager will be npm. Do not guess script names. Add commands here once they exist and have been run successfully.

## Build Commands

**Not established.**

## Testing Commands

**Not established.** The test framework is Vitest, and integration tests need Docker PostgreSQL (see `TESTING.md`). Add the actual commands here and in `TESTING.md` once they exist.

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

- Each MVP feature is done only when the acceptance criteria it covers in `PRD.md` (AC1–AC24) are verified.
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
