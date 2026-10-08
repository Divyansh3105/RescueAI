# Project Memory

_Last updated: 2026-10-08 (more scenario reference data). Update this after every meaningful session and delete anything that's out of date._

## Current Status

- **Scaffolded, no features.** It is a git repository now, pushed to <https://github.com/Divyansh3105/RescueAI> on `main`, with CI green. `web/` and `api/` exist, build, lint, type-check and each pass one trivial test. **Deployed and live at <https://rescueai-70mu.onrender.com>** (Render free, Singapore, auto-deploy from `main`), reading from Neon. `docker compose up` builds the same image locally and serves it from `http://localhost:3000` - verified on 2026-09-18: health returned `{"status":"ok","db":"up"}`, the SPA rendered it in a browser, a deep route fell back to `index.html`, and an unknown `/api/*` route returned the D-035 error shape.
- **No PRD feature is implemented.** No database table, no Drizzle schema, no migration, no auth, no scoring, no route beyond `/api/health`. All of that is Phase 2.
- The documentation set: `PRD.md`, `AGENTS.md` (the entry point), `DESIGN.md`, `ARCHITECTURE.md`, `RULES.md`, `DECISIONS.md`, `TESTING.md`, `PLAN.md`, `MEMORY.md`, and `CLAUDE.md` (which just imports AGENTS.md).
- The stack, tooling and coding rules are decided. The PRD is **Draft v2** and still **not formally approved**.

## Recently Completed

Session 2, 2026-09-15:
- `PLAN.md`: a seven-phase plan aligned to the department timeline (feature freeze Jan 10, 2027; results by January 2027; Phase-II Exam May 2027).
- The owner answered most of the open decisions, recorded as D-026 to D-034. This produced PRD Draft v2 with 24 acceptance criteria (AC25 was added later, on 2026-09-22 by D-051). The main changes:
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

Session 2026-10-02 (scenario reference data, owner B's Phase 3 work started early):
- Collected real Uttarakhand flood/landslide records in the owner's Brave browser (through the Claude in Chrome extension; Brave shows up as "Browser 1"). **Merged as PR #1** (<https://github.com/Divyansh3105/RescueAI/pull/1>, squash `1423e7d`), the repo's first PR. CI passed; **merged without the teammate review RULES.md asks for**, at the owner's request.
- `data/uttarakhand_flood_landslide_events.csv`: 13 events 1998-2025 (Malpa, Kedarnath 2013, Chamoli 2021, Kumaon Oct 2021, Gaurikund 2023, Kedarnath 2024, Dharali 2025, Dehradun 2025, and smaller ones). Columns cover place, lat/lon, deaths, missing, rescued/evacuated, responders with team counts, scenario notes, `emdat_disno` (8 rows join to `disasterIND.csv`), sources. 10 of 13 coordinates are `approx_town_centroid`, not the site.
- `data/uttarakhand_landslides_nasa_glc.csv`: 189 Uttarakhand landslides 2007-2016 with lat/lon, from the NASA Global Landslide Catalog export. `location_accuracy` is an error radius, 1-50 km. NASA asks for a citation of Kirschbaum et al. 2010 and 2015 - put it in the paper if this file is used.
- Left out on purpose: avalanches, Silkyara tunnel, Joshimath subsidence (PRD scope is flood and landslide). Dead ends: ReliefWeb API needs a registered appname, ndrf.gov.in did not load.

Session 2026-10-08 (more scenario reference data; collected with WebSearch/WebFetch, OSM Overpass and Nominatim, not the browser):
- Events file: 9 events added, now 22 covering 1998-2026: Pithoragarh 2016, Dharchula 2017, Arakot 2019, Munsiyari 2020, Sarkhet 2022 (no deaths), Chirbasa 2024, Tharali 2025, Nandanagar 2025, and Munkatiya May 2026, which was a mass stranding (~10,450 escorted) with no casualties. Existing rows are unchanged. New `coord_source` values are `osm_place_node`, `nominatim_locality`, `approx_between_places` and `approx_on_route`.
- `data/uttarakhand_rescue_timelines.csv`: event time, first response, operation span and number rescued for 13 events. **Exact arrival times are rare.** The best figures: the Army at Harsil mobilised within 10 min at Dharali; at Munkatiya SDRF was alerted at 21:16 and finished overnight; at Nandanagar a man was pulled out alive after ~16 h under debris. That last one matters if the 60-min Wait cap is questioned.
- `data/uttarakhand_responder_bases.csv`: 15 rows. **No official SDRF post list was found** (sdrf.uk.gov.in does not resolve). Only the SDRF HQ at Jolly Grant and NDRF 15th Bn Gadarpur (ndrf.gov.in units page) are confirmed. The Sonprayag, Kedarnath, Harsil, Lambagar and Badrinath posts come from news reports, and Rudraprayag, Joshimath, Bageshwar and Champawat from a 2013 plan. ITBP and Army rows are included because they were often first on site, but they are not PRD team types.
- `data/uttarakhand_settlements_osm.csv`: 13,975 named OSM places in the 13 districts (point-in-polygon on Nominatim district boundaries). **Population is filled for only 61 rows.** Census 2011 village data with coordinates is licensed (Stanford/MIT restricted; Dataful unverified). The ODbL licence requires an OSM credit.
- Not committed yet when this was written; see git.

## Currently In Progress

Nothing is half-done. Waiting on the user for the remaining decisions (see Known Problems).

## Known Problems

- **The PRD has not been explicitly approved** (now Draft v2). It now has **25** acceptance criteria: AC25 was added on 2026-09-22 (D-051) for the Admin password reset.
- **Still open and needed by about Oct 15 for Paper Part 2 (Methodology):**
  - ~~the severity rule table~~ **closed 2026-09-18 (D-047)**: a provisional points table is in PRD F5, marked `[Provisional]`. Authored from reasoning, **not** from domain consultation and **not** from `disasterIND.csv` (that file is event-level EM-DAT data with no per-request trapped/injured counts, so it cannot calibrate this rule - do not claim otherwise in the paper). The weak point is that a blank count scores 0; if Phase 6 finds the queue clusters at severity 1-2, score blanks as 1 point or make the F1 fields required.
  - severity scaling (Sev−1)/4, the team score formula, and the 2-hour Freshness window (open items 2, 3 and 6). **`MENTOR-REVIEW.md` was written 2026-09-22** to put these to Mr. Chauhan with the team's recommendations and a tick-box per item. **Needed back by Oct 15.** If there is no answer by then, adopt the recommendations, mark them `[Provisional]` and re-check in Phase 6.
    - The recommendations are: keep (severity−1)/4; keep the team formula **but reject weights where w1+w2 = 0, which currently divides by zero**; keep 120 minutes **but move the window into the Admin settings row** so Phase 6 can tune it without a redeploy.
    - The document also asks two bonus questions: whether an NDMA/SDRF triage convention should replace the D-047 severity table, and whether the mentor can reach serving SDRF/NDRF staff for the SM3 usability study.
  - ~~whether any shared commander action belongs to one commander type, and whether the office commander can edit a selection~~ **closed 2026-09-22 (D-050)**: both confirmed as written. **The important part is what the question did not ask:** nothing said an office commander cannot *create* a selection, so one could have selected and self-approved - two audit entries, one actor, SM4 reporting full compliance. AC22 now requires that an office commander cannot select and that the selector and approver are different user accounts. Enforce this in `services/decisions` in Phase 3.
  - ~~the **evaluation method**~~ **closed 2026-09-22 (D-049)**: the protocol is in `PRD.md` under Success Metrics. Roles and constraints are fixed, names are not - **Phase 4 assigns them**. The two constraints that must not be lost: the scoring author cannot build the SM2 ground truth (circularity), and the Render instance must be warmed before every timed SM1 run (a 50 s cold start would sit inside the median).
- **Provisional values** to reconsider in Phase 6: band cutoffs 0.70 / 0.50 and the 60-minute Wait cap. SM2 is measured on the top 5 of the 10-item shortlist (the agent's default; tell the user if it's questioned).
- **Still Proposed or not established:**
  - D-025 / AD11: future Python ML service. Deliberately left Proposed; it matters only if ML is added.
  - Database backups (a nightly `pg_dump` is recommended but not confirmed), VM provider, domain name.
  - Scenario dataset format, volunteer bottom tab bar, map marker shapes (needed in Phases 3-5). The real-event reference data for scenarios now exists (see 2026-10-02); the loader format does not.
  - **None of the reference data files (2026-10-02 or 2026-10-08) has per-request trapped/injured counts**, so like `disasterIND.csv` they cannot calibrate the D-047 severity table. They give realistic places, timings and scale for synthetic scenarios; the requests, volunteers and ground truth are still to be built, and must be synthetic.
- **From the 2026-09-18 plan review** (already applied to `PLAN.md`, `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`):
  - Phase 2 (Oct 8 - Nov 3) is the highest-risk phase, not Phase 4. It holds two fixed external dates.
  - Scenario data must vary Wait, Freshness and Reliability, or three formula terms are constant in the evaluation.
  - The December exam dates gate the freeze date (Jan 10, or Jan 17 if they collide).
  - Password reset is a new open PRD item (open item 7).
- **The Phase 1 location criterion is met (2026-09-22).** The placeholder page originally never called `navigator.geolocation`, so a phone had nothing to grant; a temporary "Share location" probe was added to `web/src/App.tsx`. A real phone then granted permission on the deployed HTTPS URL and returned a position at about +/-100 m. That is a network/wifi fix, not a GPS lock - normal indoors, and fine for ranking (100 m is 0.4% of the 25 km proximity radius). **Re-check outdoors in Phase 3**, when F1 and F2 start using the coordinate for real. The probe is scaffolding: **F1/F2 replace it in Phase 3** with proper `en`/`hi` strings.
- **Phase 1 items still not answered:** the domain name, and copying the timeline PDF into the repo (still only in the user's Downloads), and phase owners.
- **Paper Part 1 (Sep 10) was submitted** - confirmed by the owner 2026-09-18. No longer a risk.
- **Progress Report 1 is not written.** Due Sep 28 - Oct 7.
- **UI prototype for the report (2026-09-23):** `web/src/prototype/` replaced the placeholder `App.tsx`. A switcher at the top shows Citizen form (en/hi), Volunteer home (en/hi), On-site commander queue and Office commander approval, all on synthetic Dehradun data with no API. Scores use the PRD formulas in the browser, so the breakdowns add up, but **this is not the scoring implementation** - that is `api/src/scoring/` in Phase 2. Don't describe the prototype as working features. The old "Share location" probe is gone; the citizen form's "Use my location" does the same job. `index.css` now pins Tailwind's `dark:` variant to a `.dark` class so shadcn components stay light when the OS is in dark mode.
  - Polish pass (same day): commander Map (Leaflet + OSM, lazy-loaded so citizen phones never download it), sidebar icons, a summary strip, signed-in commander names, and a who-did-what trail on each decision showing two different accounts (AC22). The volunteer screen now has Accept -> assignment -> Mark completed plus service history; the citizen confirmation now says what happens next and mentions 112. Outline buttons use `--input` borders (3:1), the `lg` button is 44px, and control shadows are removed per DESIGN.md. `leaflet` + `@types/leaflet` were added: an adopted tool (ARCHITECTURE Maps: Decided), not a new one.
  - **Map marker shapes are only a prototype choice** (request = circle with the band letter, volunteer = square "V", team = diamond "T"). DESIGN.md lists them as Proposed; confirm them before Phase 5.
  - Committed as `cb47c72`.
- **`api` has 7 npm audit findings** (6 moderate, 1 high), all from `drizzle-kit`'s dev-only esbuild chain. `npm audit fix --force` would downgrade drizzle-kit to 0.18.1, which is worse. Left as is; it never ships to production.
- **`PLAN.md` Phase 2 still lists `LOCATION_REQUEST` in the migration list**, but D-042 replaced that table with fields on the settings row. Fix when Phase 2 starts.
- **Ask the supervisor:** the exact January deadline, the December exam dates once published, and what the Phase-I Exam expects.
- **December exams: handled 2026-09-22 (D-048).** Exams exist, dates undecided. Rather than wait, the plan assumes the overlap: F7 and F9 move into Phase 3 (server-side, integration-tested, no UI), **AC11 and AC22 now close in Phase 3**, Phase 4 becomes the UI phase with a written cut order, the freeze moves Jan 10 to Jan 17, and scenario data starts in Phase 3.
  - **Phase 3 is now the heaviest phase in the plan.** If it slips, the December squeeze happens anyway with less warning. Check it in mid-November.
  - **Phase 6 is down to two weeks** and still owes SM1-SM5 and Paper Part 3. This is the sharpest risk in the plan. If the January deadline turns out earlier than Jan 31, the freeze moves back - Phase 6 cannot absorb another cut.

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

1. **Write Progress Report 1 (due Oct 7)** - the most urgent item. The UI prototype and the new scenario reference data can both go in it.
2. **Mentor answers from `MENTOR-REVIEW.md` by Oct 15**, for Paper Part 2 (Oct 20). No answer means adopt the recommendations as `[Provisional]` (see Known Problems).
3. PRD approval.
4. **Phase 2 starts Oct 8.** Write its detailed task plan with `superpowers:writing-plans` when it starts.
5. Scenario data (owner B, in parallel): define the loader format, then build synthetic flood and landslide scenarios on the reference files in `data/` (events, timelines, responder bases, OSM settlements for placing citizens and volunteers), meeting the PLAN.md Phase 4 checklist (backdated times, varied location ages and histories, 50+ volunteers, graded ground truth).
6. Render: set the health check path to `/api/health` in the dashboard - `render.yaml` sets it but Render only reads that file for Blueprint-created services (D-046). **Warm the service before any SM1 timing run in Phase 6** - a free instance sleeps after ~15 min and cold-starts in ~50 s, which would silently inflate the median (D-044).

## Things to Be Careful About

- **Files get reformatted between turns.** Always Read a file before editing it; never edit from memory.
- **`.env.local` holds the real Neon `DATABASE_URL`.** It is git-ignored. Never print it, paste it into a file, or put it in a commit - pass it with `node --env-file=../.env.local`.
- **The `neondb_owner` password was pasted into a chat transcript on 2026-09-18**, with the owner's informed agreement, to set `DATABASE_URL` on Render through the Render MCP. **Rotating it is still worth doing**: reset the role password in the Neon console, then update the Render environment variable and re-run `neon link`. Prefer having the owner set secrets by hand next time.
- **A root `package.json` exists but is NOT a workspace.** It carries the Neon CLI packages only. Application dependencies go in `web/` or `api/` (D-043, D-045).
- **Opening a direct `.csv` link in the browser downloads it** to the owner's Downloads folder without asking. This happened once on 2026-10-02 (`Global_Landslide_Catalog_Export_rows.csv`; the owner then chose to use it). Check before navigating to file links.
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
