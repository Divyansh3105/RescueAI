# Project Memory

_Last updated: 2026-09-18 (session 3). Update this after every meaningful session and delete anything that's out of date._

## Current Status

- **Pre-implementation. Documentation only.** There is no code and no `package.json`, and the folder **is not a git repository**.
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
- **Phase 1 items not yet answered:** git init permission, copying the synopsis and timeline PDFs into `docs/` (both are only in the user's Downloads), phase owners, and whether Paper Part 1 (due Sep 10) was submitted.
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

## Next Steps

1. Get answers to the still-open items above, the severity table and the evaluation method first (Paper Part 2 is due Oct 20). Then get the PRD approved.
2. `git init`, then commit the docs. Only do this when the user asks.
3. Follow `PLAN.md` Phase 1: scaffold `web/`, `api/` and `docker-compose.yml`, then fill in the Development, Build and Testing Commands sections in `AGENTS.md` with commands that really exist. Write each phase's detailed task plan with `superpowers:writing-plans` when that phase starts.

## Things to Be Careful About

- **Files get reformatted between turns.** Always Read a file before editing it; never edit from memory.
- **Don't document commands or tools that don't exist yet.** The AGENTS.md command sections stay "Not established" until they are real.
- **Guard the hard invariants above all:**
  - no dispatch without a logged on-site selection **and** a logged office approval
  - an append-only audit log
  - citizen phone numbers and volunteer locations only in commander responses
  - access control shaped by role

## Session Handoff

- Start with `AGENTS.md`, then this file.
- Before any coding, confirm with the user:
  - Is the PRD approved?
  - The still-open items in Known Problems.
  - Permission to run `git init`.
- Then follow `PLAN.md`.
