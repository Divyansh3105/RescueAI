# Project Memory

_Last updated: 2026-09-18 (session 4). Update this after every meaningful session and delete anything that's out of date._

## Current Status

- **Scaffolded, no features.** It is a git repository now, pushed to <https://github.com/Divyansh3105/RescueAI> on `main`, with CI green. `web/` and `api/` exist, build, lint, type-check and each pass one trivial test. **Deployed and live at <https://rescueai-70mu.onrender.com>** (Render free, Singapore, auto-deploy from `main`), reading from Neon. `docker compose up` builds the same image locally and serves it from `http://localhost:3000` - verified on 2026-09-18: health returned `{"status":"ok","db":"up"}`, the SPA rendered it in a browser, a deep route fell back to `index.html`, and an unknown `/api/*` route returned the D-035 error shape.
- **No PRD feature is implemented.** No database table, no Drizzle schema, no migration, no auth, no scoring, no route beyond `/api/health`. All of that is Phase 2.
- The documentation set: `PRD.md`, `AGENTS.md` (the entry point), `DESIGN.md`, `ARCHITECTURE.md`, `RULES.md`, `DECISIONS.md`, `TESTING.md`, `PLAN.md`, `MEMORY.md`, and `CLAUDE.md` (which just imports AGENTS.md).
- The stack, tooling and coding rules are decided. The PRD is **Draft v2** and still **not formally approved**.

## Recently Completed

Session 2, 2026-09-15:
- `PLAN.md`: a seven-phase plan aligned to the department timeline (feature freeze Jan 10, 2027; results by January 2027; Phase-II Exam May 2027).
- The owner answered most of the open decisions, recorded as D-026 to D-034. This produced PRD Draft v2 with 24 acceptance criteria. The main changes:
  - **Two-level approval:** an on-site commander selects and an office commander approves. There are now two commander roles.
  - Citizen phone numbers and volunteer locations are visible **only to commanders**. Volunteers, including the assigned one, and the Admin never see them.
  - The Availability term is replaced by location **Freshness**.
  - Top-10 shortlist, 25 km proximity radius, weights sum to 1, withdrawn offers don't count toward reliability.
  - In-app location request banner (not push).
  - **English and Hindi** on citizen and volunteer screens.
  - Provisional band cutoffs (0.70 / 0.50) and Wait cap (60 min).
- All docs were updated to match.

Session 3, 2026-09-18. The owner accepted every recommendation for the technical and testing decisions (D-035 to D-040):
- API errors: `{ error: { code, message, fields? } }`, with a stable `code` the Hindi screens can translate.
- Public form rate limit: 30 requests per 10 minutes per IP, kept generous because Indian carriers share IPs.
- Reference IDs like `RQ-4821`; login by phone, 8-character minimum password, 12-hour sessions.
- Testing: a privileged truncate role for isolation, supertest, no component tests, test files next to the code, no coverage threshold, and the AC allocation accepted as written.
- CI: GitHub Actions on every pull request.
- Hindi: plain `en`/`hi` dictionaries with no i18n library (AD15 is now Decided).

Session 4, 2026-09-18 (Phase 1 build):
- `git init` on `main`, `.gitignore`, `.gitattributes` (`eol=lf`, because the team is on Windows and CI is Linux), docs committed.
- `api/`: Express 5 + strict TS + zod + Drizzle + postgres.js. `/api/health` pings the database. 404 and error handlers already use the D-035 error shape. ESLint, Prettier, Vitest, 2 passing tests.
- `web/`: Vite + React 19 + Tailwind v4 + TanStack Query + shadcn/ui. Design tokens from `DESIGN.md` are in `src/index.css`. ESLint, Prettier, Vitest, 2 passing tests. Placeholder `App.tsx` shows API and database status.
- One root `Dockerfile` (SPA + API), `docker-compose.yml` (db + app) building that same image, `render.yaml`, `.env.example`.
- **D-044: hosting moved to Render free tier + Neon PostgreSQL**, replacing the rented VM (AD6). One origin, so the session cookie stays `SameSite=Lax` and login works on phones. Caddy, `Caddyfile`, `Dockerfile.proxy` and `api/Dockerfile` deleted.
- `README.md` and MIT `LICENSE` added. Remote set to `https://github.com/Divyansh3105/RescueAI.git`.
- **Neon is live (D-045).** Project `super-hill-50061651`, branch `production`, org `org-quiet-unit-35748898`, linked 2026-09-18. `neon.ts` is the branch policy (`defineConfig({})` - project defaults). The API connected to it: `/api/health` returned `{"status":"ok","db":"up"}`. Neon agent skills committed under `.claude/skills/`.
- `.github/workflows/ci.yml`: two jobs (api with a Postgres service container, web), lint + type-check + test on every PR. **Pushed to <https://github.com/Divyansh3105/RescueAI>; both jobs passed on GitHub.**
- D-043 records the scaffold choices. `AGENTS.md`, `TESTING.md` and `ARCHITECTURE.md` updated with commands that were actually run.

## Currently In Progress

Nothing is half-done. Waiting on the user for the remaining decisions (see Known Problems).

## Known Problems

- **The PRD has not been explicitly approved** (now Draft v2).
- **Still open and needed by about Oct 15 for Paper Part 2 (Methodology):**
  - the severity rule table (PRD open item 1); this blocks F5 and the queue
  - severity scaling (Sev−1)/4, the team score formula, and the 2-hour Freshness window (open items 2, 3 and 6; agent proposals, not confirmed)
  - whether any shared commander action belongs to one commander type, and whether the office commander can edit a selection (open items 4 and 5)
  - the **evaluation method** (who builds ground truth, how the manual baseline runs, who the SUS evaluators are). When asked this, the user answered about approval levels instead, so it was never answered.
- **Provisional values** to reconsider in Phase 6: band cutoffs 0.70 / 0.50 and the 60-minute Wait cap. SM2 is measured on the top 5 of the 10-item shortlist (the agent's default; tell the user if it's questioned).
- **Still Proposed or not established:**
  - D-025 / AD11: future Python ML service. Deliberately left Proposed; it matters only if ML is added.
  - Database backups (a nightly `pg_dump` is recommended but not confirmed), VM provider, domain name.
  - Scenario dataset format, volunteer bottom tab bar, map marker shapes (needed in Phases 3-5).
- **From the 2026-09-18 plan review** (already applied to `PLAN.md`, `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`):
  - Phase 2 (Oct 8 - Nov 3) is the highest-risk phase, not Phase 4. It holds two fixed external dates.
  - Scenario data must vary Wait, Freshness and Reliability, or three formula terms are constant in the evaluation.
  - The December exam dates gate the freeze date (Jan 10, or Jan 17 if they collide).
  - Password reset is a new open PRD item (open item 7).
- **Phase 1 items still not answered:** the domain name, and copying the synopsis and timeline PDFs into the repo (both are only in the user's Downloads), phase owners, and whether Paper Part 1 (due Sep 10) was submitted.
- **Progress Report 1 is not written.** Due Sep 28 - Oct 7.
- **`api` has 7 npm audit findings** (6 moderate, 1 high), all from `drizzle-kit`'s dev-only esbuild chain. `npm audit fix --force` would downgrade drizzle-kit to 0.18.1, which is worse. Left as is; it never ships to production.
- **`PLAN.md` Phase 2 still lists `LOCATION_REQUEST` in the migration list**, but D-042 replaced that table with fields on the settings row. Fix when Phase 2 starts.
- **Ask the supervisor:** the exact January deadline, whether end-semester exams fall in December, and what the Phase-I Exam expects.

## Important Context

- **The team:** 3 B.Tech students (GEHU, team CSE27-364) plus a faculty mentor. Deadlines come from the department timeline (received 2026-09-15; milestones listed in `PLAN.md`):
  - 2026: Progress Report 1 Sep 28 – Oct 7; Paper Part 2 (Methodology) Oct 20; Phase-I Exam Oct 26 – Nov 3.
  - 2027: finished system plus results by January (Paper Part 3); paper submission and Progress Report 2 in February; Phase-II Review in March; Final Report in April; Phase-II Exam in May.
  - DECISIONS.md entries before D-026 still mention "~December 2026". Those are historical and must not be rewritten.
- **The synopsis describes far more than the MVP** (knowledge graph, RAG, ML, routing, hospitals). The PRD scope wins; treat anything else from the synopsis as a Future feature.
- **Labeling system used across all docs:**
  - PRD: `[Assumption]` means proposed but not confirmed. `[Provisional]` means decided for now and to be reconsidered against scenario data.
  - ARCHITECTURE: each decision is **Decided**, **Proposed** or **Not established**.
  - DECISIONS: each entry is **Accepted**, **Proposed** or **Superseded** (D-008 is partly superseded by D-030).
  - Keep these labels accurate. When an item's status changes, update every doc that mentions it.
  - DECISIONS.md is append-only: supersede an entry, never rewrite it.
- **How the user works:**
  - Answers quickly, often picks the recommended option, and answers by item number.
  - Sometimes answers a different question than the one asked (e.g. #17), so check each answer matches its question.
  - Likes numeric values set "for now" and marked for later reconsideration.
  - Sometimes says "suggest which one", which means make the call, then state it clearly as your decision.

## Recent Decisions

- D-001 to D-025 are from session 1; D-025 is still Proposed.
- D-026 to D-034 are from session 2, and D-035 to D-040 from session 3. See Recently Completed for both summaries.
- D-041 and D-042 are the plan and data-model review. D-043 (scaffold choices), D-044 (Render + Neon hosting, superseding AD6), D-045 (Neon CLI tooling in the repo) and D-046 (Singapore region, direct Neon connection) are from session 4.

## Next Steps

1. **The severity rule table and the evaluation method.** Both are needed for Paper Part 2 (Oct 20), and the severity table blocks F5 and the queue. `PLAN.md` says a `[Provisional]` table goes into the PRD if the real one isn't decided by Sep 25.
2. The rest of the open items above, then PRD approval.
3. **Deployment is done.** Remaining: check on a real Android phone that <https://rescueai-70mu.onrender.com> can get location permission (the last Phase 1 deploy criterion), and set the health check path to `/api/health` in the Render dashboard - `render.yaml` sets it but Render only reads that file for Blueprint-created services (D-046). Then check a phone can grant location permission on the Render HTTPS URL. **Warm the service before any SM1 timing run in Phase 6** - a free instance sleeps after ~15 min and cold-starts in ~50 s, which would silently inflate the median (D-044).
4. Write Progress Report 1 (due Oct 7).
5. Then Phase 2. Write its detailed task plan with `superpowers:writing-plans` when it starts.

## Things to Be Careful About

- **Files get reformatted between turns.** Always Read a file before editing it; never edit from memory.
- **`.env.local` holds the real Neon `DATABASE_URL`.** It is git-ignored. Never print it, paste it into a file, or put it in a commit - pass it with `node --env-file=../.env.local`.
- **The `neondb_owner` password was pasted into a chat transcript on 2026-09-18**, with the owner's informed agreement, to set `DATABASE_URL` on Render through the Render MCP. **Rotating it is still worth doing**: reset the role password in the Neon console, then update the Render environment variable and re-run `neon link`. Prefer having the owner set secrets by hand next time.
- **A root `package.json` exists but is NOT a workspace.** It carries the Neon CLI packages only. Application dependencies go in `web/` or `api/` (D-043, D-045).
- **Don't document commands or tools that don't exist yet.** The AGENTS.md command sections stay "Not established" until they are real.
- **Guard the hard invariants above all:**
  - no dispatch without a logged on-site selection **and** a logged office approval
  - an append-only audit log
  - citizen phone numbers and volunteer locations only in commander responses
  - access control shaped by role

## Session Handoff

- Start with `AGENTS.md`, then this file.
- Before any feature work, confirm with the user:
  - Is the PRD approved?
  - The still-open items in Known Problems, severity table first.
- Then follow `PLAN.md`.
- **Tool defaults have drifted from the docs.** `npm create vite` now ships oxlint and no `strict`, and `shadcn init` only offers presets that pull a web font. D-043 explains what was done instead. Expect the same on the next tool upgrade: the docs win.
