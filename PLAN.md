# Delivery Plan

_Created 2026-09-14. Updated 2026-09-15 to follow the department's official timeline (ref. GEHU/CSE/Major-Project/2026-2027/01, dated 18 July 2026). Scope is PRD F1–F14 only._

> **Status: Proposed.** The team is 3 people. The department gives several dates only as a month ("January 2027"), so this plan treats the **end of that month** as the deadline. Confirm the exact dates with the supervisor. Each phase gets its own detailed task plan (`superpowers:writing-plans`) when it starts.

## Department Milestones

| # | Milestone | Official date | What the project must have by then | Plan phase |
|---|---|---|---|---|
| 4 | Research Paper Part 1: Introduction and Literature Survey | Sep 10, 2026 | — | **Submitted** (confirmed by the owner 2026-09-18) |
| 5 | Progress Report 1 | Sep 28 – Oct 7, 2026 | Requirements, architecture, design, plan, setup status | End of 1 |
| 6 | Research Paper Part 2: Methodology | Oct 20, 2026 | Final formulas, severity rule, architecture, evaluation method | Middle of 2 |
| 7 | **Major Project Phase-I Examination** | Oct 26 – Nov 3, 2026 | A working demo of part of the system | End of 2 |
| 8 | Research Paper Part 3: Results and Discussion | January 2027 | **Finished system plus evaluation results** | End of 6 |
| 9 | Full paper submitted to a Scopus-indexed conference or journal | February 2027 | — | 7 |
| 10 | Progress Report 2 | February 2027 | — | 7 |
| 11 | Major Project Phase-II Review | March 2027 | — | 7 |
| 12 | Final Report | April 2027 | — | 7 |
| 13 | Paper accepted, registered, presented or published | April 2027 | — | 7 |
| 14 | **Major Project Phase-II Examination** | May 2027 | — | End of 7 |

Items 1–3 (team formation, supervisor allocation, synopsis presentation) are already done.

**The real engineering deadline is January 2027.** The paper's Results and Discussion section needs a finished system and measured results. After that, the work is writing, reviews and exams.

## Overview

| # | Phase | Dates | Weeks | PRD features | Acceptance criteria closed | Ends with |
|---|---|---|---|---|---|---|
| 1 | Unblock, foundation, Progress Report 1 | Sep 15 – Oct 7 | 3 | — | — | Progress Report 1 |
| 2 | Core backend, scoring, methodology | Oct 8 – Nov 3 | 4 | F13 (table), F5 rule, F6–F8 math, thin F1+F6 slice | AC3, AC5, AC8, AC9, AC17, AC18 (partial) | Paper Part 2, **Phase-I Exam** |
| 3 | Intake, volunteers, teams and queue | Nov 4 – Nov 29 | 4 | F1–F6, F12 (queue), location request, English + Hindi | AC1, AC2, AC4, AC6, AC21, AC23, AC24 | — |
| 4 | Recommendation and two-level decision loop | Nov 30 – Dec 27 | 4 | F7–F10, F13 | AC7, AC10, AC11–AC16, AC18 (complete), AC22 | — |
| 5 | Map, admin tooling and deployment | Dec 28 – Jan 10 | 2 | F11, F12 (all screens), F14 | AC19, AC20 | **Feature freeze** |
| 6 | Evaluation and Results | Jan 11 – Jan 31 | 3 | — | SM1–SM5 measured | Paper Part 3 |
| 7 | Paper, reviews, reports and Phase-II Exam | Feb 1 – May 2027 | ~17 | Bug fixes and review feedback only | — | **Phase-II Exam** |

**Feature freeze: 10 January 2027.** After it, only bugs and review feedback get fixed.

**Suggested ownership** (a proposal; change it freely):
- **A — Backend:** schema, login, services, decision service, audit log.
- **B — Scoring, evaluation and paper:** severity rule, P(r), S(v,r), explanations, scenario data, metrics, methodology and results sections.
- **C — Frontend:** role screens, forms, queue, recommendation panel, map, PWA.

A phase ends only when its exit criteria hold and the Required Checks in `TESTING.md` pass (lint, type-check, full test suite), with the real output reported.

---

## Phase 1 — Unblock, foundation, Progress Report 1

**Dates:** Sep 15 – Oct 7

**Goal:** Nothing blocks building, an empty app runs on the VM over HTTPS, and Progress Report 1 is submitted.

**Decisions to close first.** Paper Part 2 (Oct 20) has to describe the final formulas, so these are urgent:
1. Approve `PRD.md` (now Draft v2).
2. ~~**Severity rule table** (PRD open item 1).~~ **Done 2026-09-18 (D-047):** a provisional points table is in PRD F5. Still needs domain confirmation, and Phase 6 must re-check it.
3. The remaining formula details: severity scaling, the team score, and the 2-hour Freshness window (PRD open items 2, 3 and 6).
4. Whether any shared commander action belongs to only one commander type, and whether the office commander can edit a selection (PRD open items 4 and 5).
5. The evaluation method for the paper: who builds the ground truth, how the manual baseline runs, and who the SUS evaluators are.

6. ~~Which VM to use~~ - **done 2026-09-18 (D-044):** Render free tier + Neon PostgreSQL, live at <https://rescueai-70mu.onrender.com>. A custom domain is now optional; the Render subdomain is HTTPS and works for every remaining milestone.

Already decided: on 2026-09-15 (D-026 to D-034) band cutoffs and the Wait cap (both provisional), 25 km proximity, the Freshness term, weights summing to 1, reliability rules, top-10 shortlist, two-level approval, personal data only for commanders, in-app location request and English + Hindi; on 2026-09-18 (D-035 to D-040) the API error shape, the rate limit, the reference ID format, login and session rules, all testing gaps, CI on GitHub Actions and the Hindi dictionary approach.

**Build - all done 2026-09-18:**
- ~~`git init`, commit the docs, create the shared remote.~~ <https://github.com/Divyansh3105/RescueAI>
- ~~Scaffold `web/` and `api/`.~~
- ~~`docker-compose.yml`, and Drizzle connected to PostgreSQL.~~ One image (API + built SPA), db alongside it.
- ~~ESLint, Prettier and Vitest in both packages, each with a trivial passing test.~~ Two tests each.
- ~~A GitHub Actions workflow running lint, type-check and tests on every pull request.~~ Green.
- ~~Skeleton deploy serving the empty SPA and `/api/health` over HTTPS.~~ Render, not a VM (D-044).

**Write:** Progress Report 1, drawn from `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md` and this plan.

**Exit criteria:**
- Decisions 1–4 are answered and recorded in `PRD.md` / `DECISIONS.md`.
- **The December university exam dates are confirmed.** If they overlap Phase 4, move the feature freeze to Jan 17 and pull Phase 4 work forward into Phase 3.
- ~~**Severity table fallback:** if the real table isn't decided by Sep 25, a provisional table goes into `PRD.md` marked `[Provisional]`.~~ **Taken 2026-09-18, ahead of the date (D-047).**
- ~~Lint, type-check and tests pass locally in `web/` and `api/`.~~ Done, and in CI.
- The empty app loads over HTTPS (**done** - <https://rescueai-70mu.onrender.com>), **and a phone can grant it location permission (still to check)**.
- ~~The "Not established" command sections in `AGENTS.md` and `TESTING.md` list commands that have actually been run.~~ Done.
- Progress Report 1 submitted by Oct 7.

---

## Phase 2 — Core backend, scoring, methodology, Phase-I Exam

**Dates:** Oct 8 – Nov 3. Paper Part 2 is due Oct 20; the exam runs Oct 26 – Nov 3.

**Goal:** The data layer and all ranking math exist and are tested, the Methodology section is submitted, and a thin demo slice works for the Phase-I Exam.

**This is the highest-risk phase in the plan.** Two fixed external dates (Oct 20 and Oct 26) sit inside it, and it carries the schema, login, the whole scoring core, a demo and a paper section in about 13 working days. Cut scope here before cutting it anywhere else.

**Build: data, login and access (A):**
- Drizzle schema and migrations for USER, VOLUNTEER_PROFILE, VOLUNTEER_SKILL, TEAM, TEAM_CAPABILITY, RESCUE_REQUEST, SELECTION, ASSIGNMENT, SCORING_WEIGHTS, LOCATION_REQUEST, AUDIT_ENTRY and SESSION.
- Database constraints: status values, and at most one active assignment per responder.
- The app's database role gets only `INSERT`/`SELECT` on the audit table.
- Server-side sessions, httpOnly cookie, bcrypt; login, logout and current-session routes.
- Role middleware and ownership checks. A seeded Admin creates and deactivates on-site and office commanders.
- The decided API error shape `{ error: { code, message, fields? } }` (D-035), used by every route.
- Integration test harness against Docker PostgreSQL, migrating from an empty database, with the privileged truncate role from D-038.
- A seed script for local development: one Admin, one on-site and one office commander, a few volunteers and teams. This is separate from the Admin scenario loader (F14).
- All timestamps stored in UTC and displayed in IST (D-041).

**Build: scoring core (B, in parallel):**
- Severity rule, P(r), S(v,r), team score, eligibility filters, per-factor contributions, the one-line reason, and the priority band function. All are pure functions in `api/src/scoring/`.

**Build: exam demo slice (C) — bare minimum, no polish:**
- Login screen and empty role shells per `DESIGN.md`.
- A citizen request form → automatic severity → commander queue sorted by P(r), deployed on the VM.
- Out of scope for the demo: the map, recommendations, Hindi, the location banner, and any styling beyond the `DESIGN.md` defaults. Phase 3 finishes these screens, so build the slice for Phase 3 to extend, not to replace.
- Demo mechanics: prepare one volunteer, one on-site commander, one office commander and one Admin account. Four roles open at once means separate browser profiles or incognito windows, plus a phone on the same network. Rehearse the walkthrough once before Oct 24.

**Write:** Paper Part 2 (Methodology). It covers the architecture, the severity rule, P(r), S(v,r), the explanation method, and the evaluation method: manual baseline for SM1, how ground truth is built for SM2, and SUS for SM3.

**Exit criteria:**
- **AC3, AC5, AC8, AC9:** unit tests pass, named with the AC ID.
- **AC17:** UPDATE and DELETE on the audit table fail when run as the app role.
- **AC18 (partial):** each existing non-public route rejects a role that isn't allowed; only Admin can create commanders.
- The database rejects a second active assignment for the same responder.
- Paper Part 2 submitted by Oct 20.
- The demo slice runs on the deployed site for the Phase-I Exam.

---

## Phase 3 — Intake, volunteers, teams and queue

**Dates:** Nov 4 – Nov 29

**Goal:** Requests come in, volunteers and teams exist, and the commander sees a live prioritized queue (PRD UF1, UF2).

**Build:**
- **F1:** complete the request form: map pin or GPS, zod validation, optional fields, reference ID, per-IP rate limit of 30 requests per 10 minutes.
- **F2:** volunteer registration, skill declaration, availability switch that requires location, profile with last-known location and history.
- **F3:** commander skill verification, with audit entries.
- **F4:** commanders create and edit teams.
- **F5:** commander severity override, with an audit entry.
- **F6:** full queue with the score and its three parts, colored by band, refreshing about every 5 s.
- Volunteer screens built mobile-first at 375 px.
- **Location request (F2):** a commander asks all volunteers to share their location; volunteers see a banner until they do.
- **English and Hindi** on citizen and volunteer screens, with a language switch. A Hindi speaker on the team reviews every translation.

**Exit criteria:**
- **AC1, AC2, AC4, AC6** verified (integration tests; AC2 also checked by hand).
- **AC23** (location request banner) and **AC24** (English and Hindi) verified.
- **AC21:** volunteer screens and location sharing work on a 375 px Android browser (checked by hand).
- New screens checked against the `DESIGN.md` accessibility rules, including an axe DevTools or Lighthouse pass in both languages.

---

## Phase 4 — Recommendation and decision loop

**Dates:** Nov 30 – Dec 27

**Goal:** The whole core loop works end to end, and nothing can be dispatched without approval (PRD UF3, UF4, UF5). This is the largest build phase; Phase 2 carries more risk, because of its fixed external dates.

**Build:**
- **F7:** recommendation endpoint. Required skills default from the hazard and can be edited; it returns the top 10 volunteers and top 10 teams and records `first_recommended_at`.
- **F8:** recommendation panel showing contribution bars and a reason for every responder.
- Admin weights editor.
- **F9:** the two-level decision service, the only code path that dispatches. On-site commanders select, modify or reject; office commanders approve or send back on the Approvals screen. Assignments are created, with their audit entry, in the same transaction as the office approval.
- **F10:** volunteer offer screen (accept, decline, complete). The commander can withdraw an offer, mark a team's deployment complete, and set Resolved or Cancelled. Request status changes and reliability counters.
- Personal data: citizen phone numbers and volunteer locations appear only in commander responses.
- **F12:** refreshing on offers and request detail. **F13:** read-only audit log view.

**Start in parallel (B):** scenario datasets and ground-truth assignments for Phase 6. They take longer than the code, and they have to exercise the whole formula:
- **Backdated submission times**, or every request has the same Wait and the queue is ordered by severity alone.
- **Varied location ages**, or every volunteer has the same Freshness (all 1.0, or all 0).
- **Varied service histories**, or every volunteer sits at the 0.5 Reliability default.
- **At least 50 eligible volunteers per scenario**, or Precision@5 and NDCG@5 mean nothing.
- **Graded relevance in the ground truth** (for example ideal / acceptable / wrong), because NDCG needs grades, not a yes-or-no list.

**Exit criteria (integration tests unless noted):**
- **AC7, AC10, AC11, AC12, AC13, AC14, AC15, AC16, AC22** verified.
- **AC18 (complete):** every non-public route has a test for a role that isn't allowed.
- First flood and landslide scenario drafts exist.

---

## Phase 5 — Map, admin tooling and deployment

**Dates:** Dec 28 – Jan 10 (ends with the feature freeze)

**Goal:** Every MVP feature is built and running on the VM.

**Build:**
- **F11:** Leaflet/OSM map with requests colored by band, plus Available volunteers and teams.
- **F12:** confirm that every screen named in the PRD updates without a reload.
- **F14:** evaluation timestamps checked end to end, CSV export, and the Admin scenario loader.
- PWA manifest and install on Android. No offline caching: offline is a non-goal, and a stale cache would only break a live demo.
- Production deploy with a database backup (for example a nightly `pg_dump`), plus **one restore into a scratch database to prove the backup works**.
- Keep the previous Docker image tagged, so a bad deploy can be rolled back in a minute.
- An accessibility pass with axe DevTools or Lighthouse on the citizen, volunteer and commander screens, in both languages.
- Time the queue and recommendation endpoints against the largest scenario on the real VM. If a poll takes more than about a second, pre-filter candidates in SQL before scoring.
- A full manual walkthrough of UF1–UF6 on the deployed site, with all four roles open at once.

**Exit criteria:**
- **AC19** (checked by hand) and **AC20** (integration test) verified.
- All 24 acceptance criteria verified, and all Required Checks pass.
- A scenario dataset loads on the deployed site, and the full loop runs on phones and a desktop.

---

## Phase 6 — Evaluation and Results

**Dates:** Jan 11 – Jan 31

**Goal:** Measured SM1–SM5 results written up as Paper Part 3.

**Work:**
- **SM1:** run the same scenarios manually (with the same on-site and office approval steps) and with RescueAI, and compare the median time from submission to office approval.
- **Reconsider the provisional values** (band cutoffs, the 60-minute Wait cap) against the scenario data, and record the outcome in `DECISIONS.md`.
- **SM2:** Precision@5 and NDCG@5 of volunteer rankings against the ground truth, using the graded relevance defined with the scenario data. The metrics stay at 5 even though the shortlist shows 10.
- **SM3:** SUS questionnaire with evaluators acting as commanders.
- **SM4 / SM5:** from the audit export, check that 100% of assignments have an approval and 100% of recommendations have an explanation.
- **Write the limitations down** for the paper: straight-line distance in mountain terrain, synthetic volunteers, no routing, dispatch stalls when no office commander is on duty, and no automatic detection of duplicate reports.
- Fix bugs found during the evaluation runs.
- Shortlist Scopus-indexed venues whose submission deadlines fit February.

**Exit criteria:**
- SM1–SM5 results recorded, including any missed targets (SM1–SM3 targets are still assumptions).
- Paper Part 3 (Results and Discussion) submitted by the January deadline.

---

## Phase 7 — Paper, reviews, reports and Phase-II Exam

**Dates:** Feb 1 – May 2027

**Goal:** Paper submitted and accepted, reports and reviews passed, and a stable demo for the Phase-II Exam.

| When | Work |
|---|---|
| February | Finish the full paper and submit it to the chosen venue. Submit Progress Report 2. |
| March | Phase-II Review. Fix what the reviewers raise (bugs and polish only, unless the PRD is updated). |
| April | Submit the Final Report. Handle the paper's acceptance, registration and presentation. |
| May | Phase-II Examination: rehearsed demo on the deployed site. |

**Engineering during this phase:**
- Bug fixes, an accessibility pass against `DESIGN.md`, and a written demo script rehearsed with all four roles open at once (separate browser profiles plus a phone).
- Keep the VM, domain and backups running until the May exam.
- Update `ARCHITECTURE.md` (change "planned" to what actually exists), `MEMORY.md` and `DECISIONS.md`.
- **Optional:** February–April leaves room for one or two PRD Future Features (for example road routing). Each needs a PRD update and the team's agreement first, and must not put the paper or reports at risk.

**Exit criteria:**
- Paper submitted in February; Progress Report 2 and Final Report submitted on time.
- Demo site stable and rehearsed for the Phase-II Exam.

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Formula decisions not made by about Oct 15 | Paper Part 2 (Oct 20) can't describe the method | Adopt documented provisional values in Phase 1; scoring is isolated, so values can change later. **Severity table done (D-047); open items 2, 3 and 6 remain.** |
| Phase-I Exam demo not ready | Weak Phase-I evaluation | Keep the exam slice thin (form → severity → queue) and deploy it before Oct 24 |
| University end-semester exams in December | Phase 4 loses time | Confirm the exam dates now; if they fall in December, start Phase 4 work early in Phase 3 and move the freeze no later than Jan 17 |
| Evaluation data takes longer than coding | No results for Paper Part 3 | Start scenarios and ground truth in Phase 4 (owner B) |
| "January 2027" deadline is earlier than Jan 31 | Phase 6 squeezed | Get the exact date from the supervisor and shift the freeze to match |
| Scopus review takes too long for April acceptance | Milestone 13 missed | Pick a conference with a quick decision cycle; shortlist venues in January |
| VM or domain lapses before May | Demo fails at Phase-II Exam | Pay for hosting through May 2027; keep a local Docker Compose fallback |
| ~~Paper Part 1 status unknown~~ | — | **Closed 2026-09-18: submitted.** |
| Two-level approval and Hindi add work to Phases 3–4 | The Jan 10 freeze slips | Build the approval view by reusing the recommendation panel; translate only citizen and volunteer screens |
| Phase 2 is overloaded: schema, login, scoring, a demo and a paper section in 13 working days | Paper Part 2 or the Phase-I demo slips | Keep the demo slice bare; run the data layer (A) and scoring core (B) in parallel; drop demo polish first |
| Scenario data has constant Wait, Freshness or Reliability | Three formula terms do nothing in your own evaluation, and the paper can't defend them | Backdate times and vary location ages and histories (see Phase 4) |
| The two-level approval UI has no automated coverage | A regression in the approval path breaks both the demo and SM4 | Re-run the manual UF3 walkthrough after any change to the decision service or the approval view |
| A bad deploy on demo day | No demo | Keep the previous image tagged for rollback, with local Docker Compose as a fallback |
| Phase 5 runs across the New Year holidays | The freeze slips | Treat Phase 5 as one working week of capacity, not two |
