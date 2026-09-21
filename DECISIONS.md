# Decision Log

This is the record of product and technical decisions. Entries are append-only.
- To change a decision, set the old entry's status to **Superseded by D-xxx** and add a new entry. Never rewrite an old entry.
- Status is one of: **Accepted**, **Proposed** (not confirmed), or **Superseded**.
- "(ADn)" refers to the row in the `ARCHITECTURE.md` decision table.
- All entries below were made on 2026-09-11 during planning, before any code existed. The options listed are the ones actually presented to the product owner.

---

## D-001 MVP scope is the "core loop"

### Date
2026-09-11
### Status
Accepted
### Context
The synopsis describes 5 portals, 8 AI agents and 4 datastores. The deadline is ~December 2026 and the team is 3 people.
### Options Considered
1. The core loop only.
2. The core loop plus routing and hospital/shelter recommendations.
3. The full synopsis scope.
### Decision
Option 1:
- request intake
- the prioritized queue
- volunteer and team ranking with explanations
- commander approve / modify / reject
- volunteer accept / decline / complete
- the audit log and the map

### Reasoning
It is the smallest scope that shows the project's main contribution (explainable volunteer coordination with a human approving each decision) end to end within the deadline.
### Trade-offs
The knowledge graph, RAG, ML, routing, and hospital and shelter modules from the synopsis are not in the prototype.
### Consequences
Everything else is listed under PRD "Future Features". AGENTS.md forbids building it without a PRD change.
### Alternatives Rejected
Options 2 and 3 were rejected because they are too large for the deadline.

## D-002 Volunteers use a responsive web app / PWA (AD1)

### Date
2026-09-11
### Status
Accepted
### Context
The synopsis says the product is "web-based", but its architecture diagram also shows a "Volunteer Mobile App".
### Options Considered
A responsive web app / PWA, a native Android app, or both.
### Decision
A responsive web app / PWA, with GPS through the browser's Geolocation API.
### Reasoning
One codebase for every role.
### Trade-offs
- Background location tracking is limited in the browser, so the system uses the last-known location.
- There are no native push notifications.
### Consequences
- HTTPS is mandatory, because browsers only allow geolocation and PWA installation on secure sites.
- Volunteer screens must work at 375px width (AC21).
### Alternatives Rejected
A native Android app, and both together. Either would mean a second codebase.

## D-003 The synopsis tech stack is indicative, not binding

### Date
2026-09-11
### Status
Accepted
### Context
Synopsis Table 5.2 lists React, Node, Python ML, PostgreSQL + PostGIS, MongoDB, Neo4j, FAISS/Chroma and FCM.
### Options Considered
Treat it as fixed, as indicative, or as partly fixed.
### Decision
Indicative. The stack can be simplified as long as the features are delivered.
### Reasoning
Four datastores and two languages are unnecessary for the MVP scope.
### Trade-offs
Evaluators may compare the final stack with the synopsis, so any difference needs a justification. That justification is recorded in this log.
### Consequences
Enabled D-012 to D-017 (a single language and a single database).
### Alternatives Rejected
Treating the stack as fixed.

## D-004 MVP ranking uses weighted formulas, not trained ML (AD7)

### Date
2026-09-11
### Status
Accepted
### Context
The synopsis specifies an XGBoost severity classifier, a learning-to-rank model and SHAP explanations.
### Options Considered
1. Formulas only.
2. Formulas plus a trained severity model.
3. Full ML in the MVP.
### Decision
Formulas only: Eq. 4.1 for volunteer matching and Eq. 4.2 for request priority. The per-feature contributions of each score serve as the explanation.
### Reasoning
The results are deterministic, testable and explainable, and there's no dependency on training data.
### Trade-offs
The weights are hand-set, not learned, and ranking quality depends on tuning them.
### Consequences
- The weights must be editable by the Admin (AC10).
- ML moves to Future features.
- Scoring can be a pure module (D-019).
### Alternatives Rejected
Options 2 and 3. They need training data and add ML infrastructure before the deadline.

## D-005 Severity is set by a deterministic rule, which a commander can override

### Date
2026-09-11
### Status
Accepted
### Context
D-004 means there is no severity model, but the priority formula still needs a severity value.
### Options Considered
A rule with commander override, citizen-selected severity, or commander triage of every request.
### Decision
A rule based on hazard type and the numbers trapped and injured produces severity 1–5. A commander can override it, and every override is logged.
### Reasoning
It is consistent, and it avoids a manual bottleneck on every request.
### Trade-offs
The rule is only as good as its table, and **the rule table is not yet defined** (PRD Assumptions #1).
### Consequences
F5 cannot be built until the rule table exists.
### Alternatives Rejected
Citizen-selected severity (unreliable) and triage of every request by a commander (slow).

## D-006 Proximity uses straight-line distance

### Date
2026-09-11
### Status
Accepted
### Context
The synopsis defines proximity by road travel time, but routing is a Future feature.
### Options Considered
Straight-line (haversine) distance, or road travel time from OSRM or OpenRouteService.
### Decision
Straight-line distance from the responder's last-known location.
### Reasoning
There is no external service to depend on, and no GIS is needed.
### Trade-offs
Distance is inaccurate in mountain terrain, where road distance can far exceed straight-line distance.
### Consequences
PostGIS isn't needed (D-013).
### Alternatives Rejected
Road travel time. It adds an external dependency before routing is in scope.

## D-007 Responders are volunteers plus teams; teams are records the commander manages

### Date
2026-09-11
### Status
Accepted. The team-model part was the agent's recommendation after the owner asked for a suggestion.
### Context
The MVP needs to decide which resources are ranked and assigned.
### Options Considered
- **Scope:** volunteers plus teams; volunteers only; or volunteers, teams and equipment.
- **Team model:** records managed by a commander, or team-leader accounts.
### Decision
Volunteers and SDRF/NDRF teams are both ranked. Teams are commander-managed records with no login, and a dispatch is recorded as Deployed.
### Reasoning
Team-leader accounts would add another portal and another accept/decline flow before December. The volunteer offer flow already demonstrates accept and decline.
### Trade-offs
The system can't confirm that a team has acknowledged a dispatch.
### Consequences
Equipment allocation is a Future feature.
### Alternatives Rejected
Volunteers only (too narrow), volunteers plus teams plus equipment, and team-leader accounts.

## D-008 Roles and access: Admin, Commander, Volunteer, and a Citizen with no login

### Date
2026-09-11
### Status
Partly superseded by D-030 (commander roles). The citizen-access part is still Accepted.
### Context
The system needs to decide who creates privileged accounts, who verifies volunteer skills, and how citizens submit requests.
### Options Considered
- **Roles:**
  - an Admin creates commanders and commanders verify skills
  - commanders are pre-seeded and do everything
  - a separate verification-officer role
- **Citizen access:** no login with a phone number required; an account required; or fully anonymous.
### Decision
- An Admin creates commander accounts, and commanders verify skills.
- Citizens submit without logging in, but must give a phone number.
### Reasoning
There is no login barrier during an emergency, yet the commander can still call the citizen back.
### Trade-offs
The public endpoint can be abused, so rate limiting is proposed (see ARCHITECTURE Security).
### Consequences
Four roles, with the access rules in PRD AC18.
### Alternatives Rejected
Commanders doing everything, a separate verifier role, requiring citizen accounts, and anonymous submissions.

## D-009 Success metric targets are proposed values, labeled as assumptions

### Date
2026-09-11
### Status
Accepted. This was the agent's recommendation after the owner asked for a suggestion. The target values themselves still need confirmation.
### Context
The synopsis names the metrics but sets no numbers, and a PRD needs testable criteria.
### Options Considered
Proposed targets labeled as assumptions, measure-and-report only, or targets supplied by the owner.
### Decision
The proposed targets: latency at least 40% below the manual baseline, Precision@5 of at least 0.70, NDCG@5 of at least 0.75, and SUS of at least 68. All are marked `[Assumption]`.
### Reasoning
Measuring and reporting only would not be testable.
### Trade-offs
The numbers are not yet grounded in domain data.
### Consequences
See PRD Success Metrics and Assumptions #10.
### Alternatives Rejected
Measure-and-report only.

## D-010 Design foundation: calm operational light theme, system fonts, WCAG 2.2 AA

### Date
2026-09-11
### Status
Accepted
### Context
No UI existed. The users are commanders working under time pressure and volunteers using phones outdoors.
### Options Considered
- **Theme:** light; dark command-center; both.
- **Font:** system stack, Inter, or Noto Sans.
- **Accessibility:** WCAG 2.2 AA, or basics only.
### Decision
- A light theme with one blue accent. Red, amber and green are used only for meaning.
- The system font stack.
- WCAG 2.2 AA.
### Reasoning
- The light theme stays readable in sunlight.
- The system font needs no download on weak networks.
- AA makes sure an emergency tool doesn't exclude people.
### Trade-offs
No dark mode, and no custom typeface.
### Consequences
The color contrasts were checked for AA. See DESIGN.md.
### Alternatives Rejected
A dark theme, both themes (too much work before December), web fonts, and basics-only accessibility.

## D-011 UI components: React, Tailwind and shadcn/ui (AD2)

### Date
2026-09-11
### Status
Accepted
### Context
The team needs accessible components without building each one by hand.
### Options Considered
Tailwind plus shadcn/ui, Tailwind only, or deciding later with the rest of the stack.
### Decision
Tailwind plus shadcn/ui, which uses Radix primitives.
### Reasoning
Accessible dialogs, selects and tables come ready-made, which means fewer custom components to build.
### Trade-offs
shadcn/ui only works with React, so this commits the frontend to React.
### Consequences
The frontend is React. Components live in `web/src/components/ui/`.
### Alternatives Rejected
Tailwind only (more custom work), and deferring the choice.

## D-012 Backend: Node.js and Express in TypeScript (AD3)

### Date
2026-09-11
### Status
Accepted
### Context
MVP scoring is plain arithmetic, so no ML libraries are needed yet.
### Options Considered
Node.js with Express in TypeScript, Python with FastAPI, or Next.js full-stack.
### Decision
Node.js with Express in TypeScript.
### Reasoning
One language across the whole stack for a 3-person team, and it matches the synopsis backend.
### Trade-offs
Future ML and RAG work will need Python (see D-025).
### Consequences
The API code lives in `api/`.
### Alternatives Rejected
FastAPI (two languages in the MVP) and Next.js (differs from the synopsis design).

## D-013 Database: PostgreSQL without PostGIS (AD4)

### Date
2026-09-11
### Status
Accepted
### Context
The data is relational: roles, requests and assignments. The audit log must be enforceable. Proximity is straight-line (D-006).
### Options Considered
PostgreSQL, PostgreSQL with PostGIS, or MongoDB.
### Decision
PostgreSQL only. Locations are stored as plain latitude/longitude columns.
### Reasoning
One database. Database permissions can enforce the append-only audit log (D-020).
### Trade-offs
There are no spatial indexes. PostGIS is added when a Future spatial feature needs it.
### Consequences
The synopsis's MongoDB, Neo4j and vector store are all deferred.
### Alternatives Rejected
PostGIS (not needed yet) and MongoDB (a poor fit for relational data and for enforcing an append-only log).

## D-014 Database access: Drizzle ORM with drizzle-kit (AD13)

### Date
2026-09-11
### Status
Accepted
### Context
The team needs typed queries, and migrations where grants and constraints can be written in raw SQL.
### Options Considered
Drizzle with drizzle-kit, Kysely with SQL migrations, Prisma, or raw `pg` with SQL files.
### Decision
Drizzle ORM with drizzle-kit.
### Reasoning
Typed, SQL-like queries. The migrations are SQL files that can be edited by hand.
### Trade-offs
A younger ecosystem than Prisma.
### Consequences
Database row types come from the Drizzle schema (RULES.md).
### Alternatives Rejected
Kysely, Prisma (heavier, and needs raw SQL for grants anyway), and raw `pg` (untyped).

## D-015 Live updates by polling about every 5 seconds (AD5)

### Date
2026-09-11
### Status
Accepted
### Context
PRD F12 and AC2 require updates to appear within 10 seconds.
### Options Considered
Polling, WebSockets with Socket.IO, or Server-Sent Events.
### Decision
Client polling about every 5 seconds, using TanStack Query's `refetchInterval`.
### Reasoning
No extra infrastructure or connection state, and it meets the target at prototype scale.
### Trade-offs
Updates arrive with up to 5 seconds of delay, and there is constant request load.
### Consequences
Polled endpoints must avoid N+1 queries. The upgrade path is Server-Sent Events.
### Alternatives Rejected
WebSockets and SSE, which need long-lived connections that aren't needed yet.

## D-016 Frontend server state: TanStack Query, with no global store (AD13)

### Date
2026-09-11
### Status
Accepted
### Context
The frontend needs polling, caching and refreshing data after changes.
### Options Considered
TanStack Query with local state, Redux Toolkit with RTK Query, or plain fetch with `useEffect`.
### Decision
TanStack Query for all server data. `useState` and URL parameters for UI state.
### Reasoning
Polling and cache invalidation are built in, with the least boilerplate.
### Trade-offs
None significant at this scale.
### Consequences
No Redux or Zustand. No optimistic updates for decisions (RULES.md).
### Alternatives Rejected
Redux Toolkit (more boilerplate) and plain fetch (hand-rolled polling and caching).

## D-017 Deployment: one VM with Docker Compose behind Caddy (AD6, AD12)

### Date
2026-09-11
### Status
Accepted
### Context
The PRD constraint is a cloud instance of about 2 vCPU, 4 GB RAM and 40 GB disk. The synopsis lists Docker.
### Options Considered
One VM with Docker Compose, a PaaS (Vercel plus Railway or Render), or deciding later.
### Decision
One VM running Compose with three containers: Caddy (TLS and the static SPA), the API, and PostgreSQL.
### Reasoning
It matches the PRD constraint directly, and Caddy provides the required HTTPS automatically.
### Trade-offs
There is no redundancy, and the team handles operations itself.
### Consequences
Only Caddy is exposed publicly. CI/CD and backups are still not established.
### Alternatives Rejected
A PaaS (free-tier limits and more vendors) and deferring the decision.

## D-018 Authentication: server-side sessions with an httpOnly cookie, not JWT (AD9)

### Date
2026-09-11
### Status
Accepted
### Context
The synopsis listed JWT, OAuth 2.0 and bcrypt. The SPA and the API share one origin.
### Options Considered
Server-side sessions in PostgreSQL, or JWT as in the synopsis.
### Decision
Sessions stored in PostgreSQL, an httpOnly, Secure, SameSite cookie, and bcrypt for passwords. No OAuth in the MVP.
### Reasoning
Deactivating a commander revokes their access immediately, and no token is ever exposed to JavaScript.
### Trade-offs
Every request needs a session lookup in the database.
### Consequences
Deactivating a user deletes their sessions.
### Alternatives Rejected
JWT, which can't be revoked without extra machinery, and OAuth, which isn't needed for these roles.

## D-019 Scoring is pure; one decision service does all dispatching (AD8)

### Date
2026-09-11
### Status
Accepted
### Context
The ranking acceptance criteria must be testable. "No dispatch without approval" (AC11) needs a single place where it is enforced.
### Options Considered
Adopt this approach (the architect's proposal), or leave it unconfirmed. No other structure was evaluated.
### Decision
- `scoring/` contains pure functions: no database access, no clock, no randomness.
- `services/decisions` is the only code that creates assignments or deployments.
### Reasoning
AC3, AC5, AC8 and AC9 become plain unit tests, and AC11 has one point of enforcement.
### Trade-offs
Callers must load the data and pass in `now`.
### Consequences
A future ML model can replace a scoring function without changing anything else. These are Forbidden Practices in RULES.md.
### Alternatives Rejected
None formally evaluated.

## D-020 The audit log is append-only at the database level, written in the same transaction (AD10)

### Date
2026-09-11
### Status
Accepted
### Context
AC11 and AC17 must hold even if the application has a bug.
### Options Considered
Adopt this approach (the architect's proposal), or leave it unconfirmed.
### Decision
- The application's database role has only INSERT and SELECT on the audit table.
- Each audited action and its audit row are committed in one transaction.
### Reasoning
Enforcing this in the database is stronger than enforcing it in code.
### Trade-offs
Grants have to be managed in raw SQL migrations.
### Consequences
No code, migration or seed may update or delete audit rows. Integration tests check this through the database role.
### Alternatives Rejected
None formally evaluated.

## D-021 Tooling: npm, Vitest, ESLint + Prettier, Vite, zod, Leaflet; `web/` + `api/` layout (AD12, AD13)

### Date
2026-09-11
### Status
Accepted
### Context
The team needs one toolchain for both halves of the stack.
### Options Considered
- npm with Vitest, ESLint and Prettier
- pnpm with Vitest and Biome
- npm with Jest, ESLint and Prettier

Vite, zod, Leaflet and the layout were adopted together as the architect's proposal.
### Decision
npm, Vitest, ESLint and Prettier, together with Vite, zod, Leaflet, and a `web/` + `api/` layout. There is no shared package at the start.
### Reasoning
- npm ships with Node.
- Vitest works for both Vite and Node.
- Leaflet was already in the synopsis.
### Trade-offs
npm installs are slower than pnpm.
### Consequences
One tool per job. Adding an alternative is forbidden (RULES.md).
### Alternatives Rejected
pnpm with Biome (an extra install for everyone) and Jest (needs extra TypeScript/ESM configuration).

## D-022 Strict TypeScript with no `any`

### Date
2026-09-11
### Status
Accepted
### Context
This sets the type-safety baseline for both `web/` and `api/`.
### Options Considered
Strict with no `any`; strict with `any` allowed if justified in a comment; or default settings.
### Decision
`strict: true` with no `any`. Types come from zod and Drizzle, and the naming conventions are in RULES.md.
### Reasoning
It catches errors at the API and database boundaries.
### Trade-offs
Development is slower when working with untyped libraries.
### Consequences
Using `any`, `as any` or `@ts-ignore` is a Forbidden Practice.
### Alternatives Rejected
Allowing `any` with a comment, and the default settings.

## D-023 Git workflow: feature branch, pull request, one reviewer, Conventional Commits

### Date
2026-09-11
### Status
Accepted. The repository has not been initialized yet.
### Context
There are three developers, and `main` must always be ready to demo.
### Options Considered
Branch plus PR with one review; committing directly to `main`; or branch plus PR with self-merge.
### Decision
Short-lived branches, a PR reviewed by one teammate, Conventional Commits, and no force-pushes to `main`.
### Reasoning
Every change gets a second pair of eyes, and `main` stays deployable.
### Trade-offs
Merges wait for a review.
### Consequences
AI agents never commit, push or merge unless asked.
### Alternatives Rejected
Committing directly to `main`, and self-merging.

## D-024 Testing bar: unit tests plus API integration tests against real PostgreSQL

### Date
2026-09-11
### Status
Accepted
### Context
The team must decide which tests a change needs before it is merged.
### Options Considered
Unit plus API integration; unit only; or unit, integration and end-to-end.
### Decision
- Vitest unit tests for scoring (AC3, AC5, AC8, AC9).
- API integration tests against a real PostgreSQL in Docker for AC11, AC14, AC17 and AC18.
- No end-to-end tests in the MVP.
### Reasoning
The rules that matter most (approval, audit, access) depend on database behavior, and mocks can't prove them.
### Trade-offs
The UI flows have no automated coverage.
### Consequences
Running tests requires Docker. Tests are named after the acceptance criterion they cover.
### Alternatives Rejected
Unit only (can't prove the rules) and end-to-end (takes too long before the deadline).

## D-025 Future ML and RAG run as a separate Python service (AD11)

### Date
2026-09-11
### Status
**Proposed.** Not yet confirmed.
### Context
The Future features (severity classifier, learning-to-rank, SHAP, RAG) need the Python ecosystem, but the MVP is TypeScript-only.
### Options Considered
A separate Python service behind the API. No alternatives have been evaluated yet.
### Decision
Pending.
### Reasoning
It keeps the MVP single-language, and the Python part can be deployed and scaled separately.
### Trade-offs
A second service to run on the 4 GB VM.
### Consequences
Not applicable until accepted.
### Alternatives Rejected
None yet.

## D-026 Priority band cutoffs: Critical ≥ 0.70, High ≥ 0.50 (provisional)

### Date
2026-09-15
### Status
Accepted, **provisional**. Reconsider against scenario data in Phase 6.
### Context
DESIGN.md colors the queue and map by priority band, but PRD open item #12 had no cutoffs.
### Options Considered
The agent's proposal (0.70 / 0.50), other values, or waiting for scenario data.
### Decision
Critical when P(r) ≥ 0.70, High when P(r) ≥ 0.50, otherwise Normal.
### Reasoning
Building can start now. The cutoffs live in one scoring function, so they are cheap to change.
### Trade-offs
The values are not grounded in data yet. Cutoffs set too low would make most requests red.
### Consequences
PRD F6 and DESIGN.md Colors updated. Phase 6 re-checks the cutoffs.
### Alternatives Rejected
Waiting for scenario data, which would block queue coloring until January.

## D-027 Wait and Proximity functions

### Date
2026-09-15
### Status
Accepted. The 60-minute Wait cap is **provisional** (reconsider in Phase 6). The 25 km radius is final.
### Context
PRD F6 and F7 only said that Wait rises with time and Proximity falls with distance. The Methodology section (due Oct 20) needs exact functions.
### Options Considered
- **Wait:** linear with a cap at 60 minutes (proposal), or a different cap.
- **Proximity:** linear to 0 at a fixed radius, or 1/(1 + d/k).
### Decision
- Wait = min(minutes since submission ÷ 60, 1).
- Proximity = max(0, 1 − distance ÷ 25 km).
### Reasoning
Linear functions are easy to explain in the paper and in the ScoreBreakdown.
### Trade-offs
- After 1 hour, waiting longer no longer raises priority.
- 25 km in a straight line can be far longer by road in the hills (see D-006).
### Consequences
PRD F6 and F7 updated.
### Alternatives Rejected
1/(1 + d/k): harder to explain, and it never reaches 0.

## D-028 The Availability term is replaced by location Freshness

### Date
2026-09-15
### Status
Accepted. The 2-hour window is the agent's proposal and is not yet confirmed.
### Context
Availability is already an eligibility filter, so every ranked volunteer had the same Availability value. The term changed no ranking.
### Options Considered
Keep it as a constant 1, redefine it as location freshness, or drop it.
### Decision
- w3 multiplies Freshness = max(0, 1 − location age in minutes ÷ 120).
- Availability stays an eligibility filter.
- No volunteer is excluded for an old location; Freshness lowers their score instead.
### Reasoning
Every term in the formula now affects ranking, which the paper has to justify. It also handles stale locations without a hard cutoff.
### Trade-offs
The formula now differs from synopsis Eq. 4.1, which names Availability. The paper must explain the change.
### Consequences
PRD F7 and AC8 updated. The scoring factor name changes from `availability` to `freshness` (RULES.md).
### Alternatives Rejected
A constant term (does nothing) and dropping the term (a bigger departure from the synopsis).

## D-029 Weights sum to 1; withdrawn offers don't count toward reliability

### Date
2026-09-15
### Status
Accepted
### Context
The PRD didn't say whether weights must be normalized, or how withdrawn offers affect reliability.
### Options Considered
- **Weights:** must sum to 1, checked in the Admin form; or free values.
- **Withdrawals:** counted as offers, or not counted.
### Decision
- w1 + w2 + w3 + w4 = 1 and α + β + γ = 1, enforced in the Admin form and the API.
- Reliability = completed ÷ (offered − withdrawn). Declines still count.
### Reasoning
- Scores stay in [0, 1] and remain comparable after a weight change.
- A volunteer isn't penalized when a commander changes their mind.
### Trade-offs
The Admin has to adjust weights together.
### Consequences
PRD F7, AC10 and AC15 updated.
### Alternatives Rejected
Unnormalized weights, and counting withdrawals against volunteers.

## D-030 Two-level approval: on-site commander selects, office commander approves (AD14)

### Date
2026-09-15
### Status
Accepted. Supersedes the commander-role part of D-008.
### Context
The owner requires every dispatch to be approved at two levels: by the commander at the disaster site and by the commander at the office.
### Options Considered
1. On-site commander selects, office commander approves.
2. Office commander selects, on-site commander confirms.
3. Both approve the same selection, in any order.
### Decision
Option 1:
- Two commander roles, On-site and Office, both created by the Admin.
- The on-site commander selects, modifies or rejects.
- The office commander approves the selection (offers are sent and teams become Deployed) or sends it back with a reason.
- Both steps are audited.
- Other commander actions are open to both roles (PRD `[Assumption]`).
### Reasoning
The on-site commander knows the ground situation; the office commander holds the authority.
### Trade-offs
- Dispatch is slower, which works against SM1.
- Demos need two commander accounts.
- One more screen (Approvals).
### Consequences
- PRD: roles, F9, F13, F14, UF3, AC11, AC12, AC20, new AC22, SM1, SM4.
- ARCHITECTURE: new SELECTION entity and the decision service boundary.
- DESIGN: DecisionBar and the new ApprovalBar.
- RULES: role and selection status values.
### Alternatives Rejected
Options 2 and 3.

## D-031 Citizen phone numbers and volunteer locations only on commander dashboards

### Date
2026-09-15
### Status
Accepted. Replaces PRD assumption #8.
### Context
The PRD assumed commanders, the Admin and the assigned volunteer could all see this data.
### Options Considered
Commanders plus the volunteer who accepted; or commanders only.
### Decision
- Only on-site and office commanders see citizen phone numbers and volunteer locations.
- Volunteers (even after accepting) and the Admin never see them.
- Audit entries and CSV exports leave them out.
- Volunteers still see the incident location after accepting, and their own location.
### Reasoning
The owner's privacy choice: the least possible exposure of personal data.
### Trade-offs
A volunteer can't call the citizen directly, so commanders must pass details on. This is slower in the field.
### Consequences
PRD F10, F13, F14, AC14, AC18, AC20 and the security sections of AGENTS.md, ARCHITECTURE.md and RULES.md updated.
### Alternatives Rejected
Commanders plus the volunteer who accepted.

## D-032 Volunteers are asked for their location through an in-app banner

### Date
2026-09-15
### Status
Accepted
### Context
The owner wants volunteers asked to share their location when a disaster hits.
### Options Considered
An in-app banner, a push notification (Firebase Cloud Messaging), or SMS.
### Decision
A commander issues a location request. Every volunteer sees a banner on their home screen until they share a location newer than the request.
### Reasoning
No new external service, and it fits the polling architecture. Push notifications are a PRD Future feature.
### Trade-offs
Volunteers who don't open the app don't see the request.
### Consequences
PRD F2, F12, F13 and AC23 updated. New LOCATION_REQUEST entity in ARCHITECTURE.md.
### Alternatives Rejected
Push notifications (new service, 1–2 extra weeks) and SMS (paid provider, cost per message).

## D-033 English and Hindi on citizen and volunteer screens (AD15)

### Date
2026-09-15
### Status
Accepted. The implementation approach (plain dictionaries, no i18n library) is **Proposed**.
### Context
The PRD assumed English only. Many citizens and volunteers in Uttarakhand prefer Hindi.
### Options Considered
Citizen and volunteer screens only; or all screens.
### Decision
Citizen and volunteer screens switch between English and Hindi. Commander and Admin screens, and explanations, stay English.
### Reasoning
People in the field benefit most, and it is about half the translation work of all screens.
### Trade-offs
Translation and review work. Hindi text is often longer, so layouts must flex.
### Consequences
PRD Technical Constraints and AC24 updated. DESIGN.md gets a language switch and a `lang` attribute rule. RULES.md forbids hard-coded text on these screens.
### Alternatives Rejected
All screens.

## D-034 Top-10 shortlist, and confirmed PRD assumptions

### Date
2026-09-15
### Status
Accepted
### Context
PRD assumptions #2–#7 and #9–#11 needed the owner's confirmation.
### Options Considered
Accept each default, or change it.
### Decision
- The shortlist shows the top 10 volunteers and top 10 teams (was 5).
- Confirmed as written: default required skills per hazard; reliability 0.5 with no history; availability as an eligibility filter; equal initial weights; at most one active assignment, with withdrawal of pending offers; SM1–SM3 targets (real numbers reported even if missed); the 10-second update target.
### Reasoning
A longer list gives commanders more choice. The other defaults matched the owner's expectations.
### Trade-offs
Ten cards with full ScoreBreakdowns make a long panel. SM2 is still measured on the top 5.
### Consequences
The `[Assumption]` labels on these items are removed from the PRD.
### Alternatives Rejected
A top-5 shortlist.

## D-035 API error shape

### Date
2026-09-18
### Status
Accepted (was Proposed since 2026-09-11)
### Context
Every route needs one error format. The frontend handles all errors through it, and the Hindi screens need to translate error text.
### Options Considered
The agent's proposal `{ error: { code, message, fields? } }`, or a flat `{ message }`.
### Decision
`{ "error": { "code", "message", "fields"? } }`. `code` is a stable machine-readable string, `message` is human-readable English, and `fields` carries per-field validation messages. Stack traces, SQL and other users' IDs never appear.
### Reasoning
A stable `code` lets citizen and volunteer screens show Hindi text for the same error (D-033), which a message-only shape can't do.
### Trade-offs
Every error needs a code defined for it.
### Consequences
ARCHITECTURE.md API Architecture and RULES.md Error Handling updated. AD-table note about the shape being Proposed removed from AGENTS.md.
### Alternatives Rejected
A flat `{ message }` shape, which can't be translated reliably.

## D-036 Public submission endpoint: 30 requests per 10 minutes per IP

### Date
2026-09-18
### Status
Accepted (was Proposed since 2026-09-11)
### Context
The citizen request form is the only unauthenticated write, so it can be abused. Indian mobile carriers put many users behind one shared IP.
### Options Considered
A strict limit (a handful of requests per IP), or a generous limit.
### Decision
30 requests per 10 minutes per IP.
### Reasoning
A strict per-IP limit would block real citizens sharing a carrier IP during a disaster, which is a worse failure than some spam.
### Trade-offs
A determined abuser can still submit 30 fake requests per window per IP. Commanders can cancel them.
### Consequences
ARCHITECTURE.md Security Architecture and PLAN.md Phase 3 updated.
### Alternatives Rejected
A strict limit, because of carrier-level shared IPs.

## D-037 Reference ID format, login identifier, password and session rules

### Date
2026-09-18
### Status
Accepted
### Context
These were never specified, and Phase 2 builds login.
### Options Considered
Reference IDs: a short code, or a UUID. Login: phone number, or email.
### Decision
- Request reference IDs look like `RQ-4821`.
- Volunteers and commanders log in with a phone number and password.
- Passwords are at least 8 characters.
- Sessions last 12 hours.
### Reasoning
A citizen may have to read the reference ID aloud over the phone, so a UUID is unusable. Phone numbers are the identifier the PRD already collects. A 12-hour session covers a volunteer's shift without keeping a stolen phone logged in indefinitely.
### Trade-offs
Short IDs need a uniqueness check on insert. Volunteers on a long deployment may have to log in again.
### Consequences
PRD F1 and F2, ARCHITECTURE.md Security Architecture updated.
### Alternatives Rejected
UUID reference IDs and email login.

## D-038 Testing gaps closed: isolation, client, component tests, layout, coverage, allocation

### Date
2026-09-18
### Status
Accepted. Closes the "Not established" items in TESTING.md and makes the criteria allocation final.
### Context
TESTING.md listed six open items, and integration tests start in Phase 2.
### Options Considered
- Isolation: a fresh database per file, a fresh schema, or a privileged role that truncates.
- API client: supertest or raw fetch.
- Component tests: React Testing Library, or none.
- Layout: tests next to the code, or a separate folder.
- Coverage: a percentage threshold, or the criteria list only.
### Decision
- Migrations run once, and a separate privileged role (never the app role) truncates the tables, including the audit table, between test files.
- supertest for API tests.
- No component-test library, and no frontend mocking; citizen and volunteer screens are checked by hand.
- Test files sit next to the code, named `*.test.ts`.
- No numeric coverage threshold.
- The proposed allocation of the remaining acceptance criteria is accepted as written.
### Reasoning
Truncating with a privileged role keeps the app role unable to delete audit rows, which is what AC17 depends on. The MVP's UI criteria are verified by hand anyway (D-024), so a component-test library would add a tool with nothing to run in it.
### Trade-offs
UI components have no automated tests. Test cleanup needs a second database role in the test setup.
### Consequences
TESTING.md Test Stack, Database Testing, Mocking, Naming and Coverage sections updated.
### Alternatives Rejected
Giving the app role delete rights (would break AC17), a fresh database per test file (slow), and a coverage percentage (encourages tests that prove nothing).

## D-039 CI: GitHub Actions on every pull request

### Date
2026-09-18
### Status
Accepted
### Context
Three people merge into `main`, which must stay demo-ready (D-023), but there was no CI.
### Options Considered
GitHub Actions, or running the checks locally only.
### Decision
A GitHub Actions workflow runs lint, type-check and the full Vitest suite, including integration tests against PostgreSQL in Docker, on every pull request. Deployment stays manual.
### Reasoning
It stops a broken branch from being merged when a reviewer forgets to run the checks. It is free for this repository size and needs no new service beyond GitHub itself.
### Trade-offs
Integration tests need a PostgreSQL service in the workflow, so CI runs are slower than local ones.
### Consequences
TESTING.md CI section, ARCHITECTURE.md Deployment Architecture and PLAN.md Phase 1 updated. The workflow file itself does not exist yet.
### Alternatives Rejected
Local-only checks, which depend on reviewers remembering.

## D-040 Hindi through plain dictionaries, with no i18n library (AD15)

### Date
2026-09-18
### Status
Accepted. Confirms the approach proposed with D-033.
### Context
D-033 put citizen and volunteer screens in English and Hindi, but left the implementation Proposed.
### Options Considered
Plain TypeScript dictionaries for `en` and `hi`, or an i18n library such as react-i18next.
### Decision
Two plain dictionaries with the same keys, and a small hook to read the current language. No library.
### Reasoning
Two languages with no plurals-heavy or date-formatting needs don't justify a dependency, and RULES.md keeps one tool per job.
### Trade-offs
No built-in pluralization or interpolation helpers; the team writes the few it needs.
### Consequences
ARCHITECTURE.md AD15 and the Tech Stack row move from Proposed to Decided. RULES.md UI Rules updated.
### Alternatives Rejected
react-i18next, which is a new dependency for a two-language prototype.

## D-041 Timestamps stored in UTC, displayed in IST

### Date
2026-09-18
### Status
Accepted
### Context
No document said where timestamps live. The Wait term, the evaluation timestamps (PRD F14), SM1 and the CSV export all depend on it, and a mismatch would shift results silently.
### Options Considered
Store UTC and convert for display, or store IST throughout.
### Decision
All timestamps are `timestamptz` in UTC. The UI and CSV exports render IST.
### Reasoning
UTC storage is the standard way to avoid ambiguity, and all evaluation is in one time zone anyway, so conversion happens only at the edges.
### Trade-offs
Every display path needs the conversion, and CSV readers must know the column is IST.
### Consequences
ARCHITECTURE.md Database Architecture, PRD Technical Constraints and PLAN.md Phase 2 updated.
### Alternatives Rejected
Storing IST, which breaks as soon as anything compares or exports timestamps.

## D-042 Data-model and UI simplifications from the plan review

### Date
2026-09-18
### Status
Accepted
### Context
A review before Phase 2 writes migrations found three pieces of planned structure that duplicate something already in the design.
### Options Considered
Build as planned, or trim each item.
### Decision
- **SELECTION** stores the chosen responders, the required skills and its status only. The explanation snapshot stays in the audit entry, which already keeps it.
- **The location request** is an actor and timestamp on the settings row, not its own table. History lives in the audit log.
- **No database CHECK constraint** that weights sum to 1; zod at the API boundary is enough, because only the Admin writes that row.
- **The office commander's view is an "Awaiting approval" filter on the Queue**, not a separate Approvals screen. It reuses the split view with a read-only recommendation panel.
### Reasoning
Each removed piece either duplicated stored data or duplicated a screen. Less to build before the January freeze, and one less place for the two copies to disagree.
### Trade-offs
Reading "what the on-site commander saw" means reading the audit entry rather than the selection row.
### Consequences
ARCHITECTURE.md Database Architecture and DESIGN.md Layout, Component Patterns and Empty States updated. PLAN.md Phase 2 migration list keeps SELECTION but drops LOCATION_REQUEST.
### Alternatives Rejected
Building all four as first planned.

## D-043 Phase 1 scaffold choices

### Date
2026-09-18
### Status
Accepted
### Context
Scaffolding `web/` and `api/` forced four small choices that the existing docs did not cover, and one conflict with what the current Vite template ships.
### Options Considered
Take each tool's defaults, or bend them to `RULES.md` and `DESIGN.md`.
### Decision
- **ESLint, not oxlint.** `npm create vite` now scaffolds oxlint. It was removed and replaced with ESLint + `typescript-eslint`, because `RULES.md` -> Dependency Rules adopts ESLint (D-021) and forbids an alternative to an adopted tool.
- **`strict: true` added by hand.** The Vite React-TS template no longer sets it. `RULES.md` -> Type Safety requires it, so `strict` and `noUncheckedIndexedAccess` were added to both packages.
- **shadcn/ui initialized by hand, not through its CLI presets.** The current `shadcn init` only offers named presets (Nova, Vega, ...), and every one ships a web font. `DESIGN.md` -> Do Not forbids web fonts and dark mode. So `components.json`, `src/lib/utils.ts` and the CSS variables in `src/index.css` were written directly from the `DESIGN.md` colour table, using the exact hex values recorded there. `npx shadcn add <component>` works against that config and was verified with `button`.
- **Two independent npm packages, no workspace root.** `web/` and `api/` each have their own `package.json` and `package-lock.json`. There is no root manifest.
- **Caddy serves the SPA from its own image.** `Dockerfile.proxy` builds `web/` in a Node stage and copies `dist/` into the Caddy image, so there is no third "web" container at runtime.
### Reasoning
The first three are the existing rules applied to tools whose defaults have drifted. The last two keep the deployment to the three containers `ARCHITECTURE.md` already describes, and match "there is no shared package between `web/` and `api/` at the start".
### Trade-offs
Writing the shadcn tokens by hand means the design tokens are ours to maintain: a future `shadcn` upgrade will not update them. That is the intended direction anyway, since `DESIGN.md` is the source of truth for colour.
A workspace root would let one `npm ci` install both packages. Two `npm ci` calls are cheap, and CI runs the packages as separate jobs regardless.
### Consequences
`AGENTS.md` (project state, repository structure, all three command sections), `TESTING.md` (state, commands, CI) and `ARCHITECTURE.md` (state, repository structure, CI note) updated in the same change.
### Alternatives Rejected
Keeping oxlint; accepting a shadcn preset and its web font; an npm workspace root; a separate static-file container.

## D-044 Deploy on Render free tier with Neon PostgreSQL, one origin

### Date
2026-09-18
### Status
Accepted. Supersedes AD6 ("one VM with Docker Compose") as the deployment target. Docker Compose remains, as the local development stack.
### Context
D-011/AD6 assumed a rented VM, which the PRD sized at about 2 vCPU and 4 GB. There is no hosting budget, and the deployed demo has to stay reachable from Phase 2 (the Phase-I Examination, Oct 26 - Nov 3 2026) until the Phase-II Examination in May 2027 - roughly nineteen months. The owner asked for free hosting, naming Render, Netlify and Vercel.
### Options Considered
1. Vercel or Netlify for the SPA, Render for the API, a managed free PostgreSQL.
2. Vercel serverless functions for the whole backend.
3. One Render web service serving both the SPA and the API, with Neon PostgreSQL.
4. Keep the rented VM.
### Decision
Option 3.
- **One Render free web service**, `runtime: docker`, building the repository's root `Dockerfile`. That image builds `web/` and `api/` and copies the SPA build into `./public`; Express serves those files and falls back to `index.html` for any non-`/api` GET.
- **Neon free PostgreSQL**, not Render's. `DATABASE_URL` is set by hand in the Render dashboard and never committed.
- **Caddy, `Caddyfile`, `Dockerfile.proxy` and `api/Dockerfile` are deleted.** Render terminates TLS, and `docker-compose.yml` now builds the same root `Dockerfile`, so there is one build path instead of two that can drift.
### Reasoning
**Splitting the frontend and backend across two hosts breaks login on phones.** Different origins make the session cookie cross-site, which requires `SameSite=None`, and mobile Safari blocks third-party cookies by default. AC21 and AC24 can only be verified on a real handset, so that failure would surface late and look like a mystery. Serving both from one origin keeps `SameSite=Lax` and keeps the "no CORS needed" property ARCHITECTURE.md already assumed.

Option 2 was rejected because server-side sessions in PostgreSQL and a pooled database connection are a poor fit for serverless functions; it would mean rewriting the auth design in D-009/AD9 for no gain. Option 4 costs money the project does not have.

Neon rather than Render PostgreSQL because **Render deletes a free database after 30 days**, which over nineteen months means repeatedly recreating and reseeding it, including during the evaluation runs.
### Trade-offs
- **The free service sleeps after about 15 minutes idle, and a cold start takes roughly 50 seconds.** This is a measurement hazard, not only a demo annoyance: the SM1 timing comparison in Phase 6 must warm the service before each run, or the median time-to-approval silently includes a cold start. This belongs in the evaluation protocol.
- The database is now a network hop away over TLS rather than a container on the same Docker network. At prototype scale this is not a latency concern, but it is no longer inside a single trust boundary.
- Local development loses HTTPS. `http://localhost:3000` is a secure context in every browser, so geolocation and PWA install still work locally; testing on a real phone goes through the deployed HTTPS URL.
- A Render free instance is smaller than the PRD's 2 vCPU / 4 GB figure. That figure came from the synopsis and was never a measured requirement.
### Consequences
`ARCHITECTURE.md` updated: system overview, system diagram, tech stack, repository structure, API architecture, scalability, deployment and the AD6 and AD12 rows. `README.md` and `AGENTS.md` updated. The domain name and the database backup strategy are still Not established. Deployment becomes Render's automatic build on push to `main`, replacing the manual VM deploy.
### Alternatives Rejected
Vercel or Netlify for the SPA with a separate API host (cross-site cookie); Vercel serverless functions (incompatible with the decided session design); Render's own free PostgreSQL (deleted after 30 days); keeping the paid VM.

## D-045 Neon CLI tooling in the repository

### Date
2026-09-18
### Status
Accepted. Implements D-044.
### Context
D-044 chose Neon for PostgreSQL. Neon's setup adds files to the repository, and one of them contradicts D-043.
### Options Considered
Run the Neon CLI setup as documented, or link the project by hand and keep the repository free of Neon tooling.
### Decision
Ran the documented setup. Project `super-hill-50061651`, branch `production`, org `org-quiet-unit-35748898`, linked on 2026-09-18.
- **`neon.ts`** is the branch policy, applied with `neon deploy`. It is currently `defineConfig({})` - no managed services, no branch overrides, so Neon's project defaults apply.
- **A root `package.json`** now exists, holding `@neon/config` and `@neon/env` only. It is marked `private` and carries a comment saying so. **This is a narrow exception to D-043's "two independent npm packages, no workspace root":** it is not a workspace, declares no scripts, and `web/` and `api/` remain independent with their own lockfiles.
- **`.claude/skills/` and `skills-lock.json` are committed**, so all three teammates get the same Neon agent skills (about 328 KB, 25 files).
- **`.neon` and `.env.local` are git-ignored.** `neon link` writes the real `DATABASE_URL` into `.env.local`; it is a secret and never committed (RULES.md -> Security Rules). `neon link` added `.neon` to `.gitignore` itself.
### Reasoning
The CLI path is the one Neon documents and keeps the link reproducible for the other two teammates. The root manifest is the cost of `neon.ts` being TypeScript that imports a package; refusing it would mean hand-editing project settings in the Neon console instead, which is not reviewable in git.
### Trade-offs
A root `package.json` invites someone to add application dependencies or scripts there. It is marked `private` with a comment, but that is a convention, not a guard.
The MCP install minted an account-scoped Neon API key (`neon-cli-mcp-...`, id 3346425) stored in the agent configs outside the repository. Revoke with `neon api-keys revoke 3346425` if the machine is compromised or an agent config is shared.
### Consequences
Verified 2026-09-18: `neon config plan` reports no drift, and the API connected to the `production` branch, with `/api/health` returning `{"status":"ok","db":"up"}`. Local development can now run against either the Docker PostgreSQL container or Neon. `ARCHITECTURE.md`, `AGENTS.md` and `README.md` updated.
### Alternatives Rejected
Linking the project by hand through the Neon console, which keeps the repository clean but puts the configuration outside version control.

## D-046 Render service settings: Singapore, and the direct Neon connection

### Date
2026-09-18
### Status
Accepted. Implements D-044.
### Context
Creating the Render service forced two choices that the plan did not cover.
### Options Considered
Region: Oregon (Render's default, and where the owner's other service runs) or Singapore. Connection: Neon's pooled connection string or the direct (unpooled) one.
### Decision
- **Region `singapore`.** Round-trip from Dehradun is roughly 60 ms rather than about 230 ms from Oregon.
- **`DATABASE_URL` is Neon's direct (unpooled) connection string**, not the pooled one.
### Reasoning
**Region:** SM1 measures the median time from submission to office approval, and SM2/SM3 are run by evaluators in India. Every polled screen re-fetches about every 5 seconds, so a 170 ms difference per request is felt across the whole demo and sits inside the numbers the paper reports.

**Connection:** Neon's pooled endpoint is PgBouncer in transaction mode, which does not support session-level prepared statements. `postgres.js` uses prepared statements by default, so the pooled string needs `prepare: false` in `api/src/db/client.ts` or queries fail in ways that look random. The pooled endpoint exists for serverless functions that open a connection per invocation. RescueAI is one long-lived Node process on a single instance that keeps its own pool, which is exactly the case the direct connection is for.
### Trade-offs
The direct connection means the instance holds real Postgres connections. At one free instance this is far below any Neon limit; if the service is ever scaled to several instances, revisit this and either raise the Neon compute size or move to the pooled string with `prepare: false`.
Singapore splits the project's Render services across two regions, since the owner's other service is in Oregon. They are unrelated, so this costs nothing.
### Consequences
Service `srv-damfpbm7bikc73bgavj0`, URL <https://rescueai-70mu.onrender.com>, auto-deploying from `main`. `ARCHITECTURE.md` and `README.md` record the URL.
**The health check path is empty.** `render.yaml` sets `healthCheckPath: /api/health`, but Render only reads `render.yaml` for Blueprint-created services, and this one was created through the API. Set it in the dashboard, or recreate the service as a Blueprint.
### Alternatives Rejected
Oregon (latency); the pooled connection string (silent prepared-statement failures with `postgres.js`).

## D-047 Provisional severity rule table

### Date
2026-09-18
### Status
Accepted as **[Provisional]**. Closes PRD open item 1. Must be reconsidered against scenario data in Phase 6.
### Context
PRD F5 requires a documented, deterministic 1-5 severity rule over hazard type, people trapped and people injured, but left the table to "domain consultation". It blocks F5, the F6 queue and the Methodology section of Paper Part 2 (due Oct 20). `PLAN.md` set a fallback: if the real table is not decided by Sep 25, a provisional one goes into the PRD so nothing downstream stalls.

Two sources were checked and neither supplies a table:
- **The project synopsis** (Section 4.3) estimates severity with a gradient-boosted classifier trained on hazard type, weather and terrain. That is the ML approach the MVP deliberately dropped, and it is listed under PRD Future Features.
- **`disasterIND.csv`** (EM-DAT, 783 India records) is **event-level**: `Total Deaths`, `No. Injured` and `No. Affected` aggregated per disaster event across a region and over days. It contains no per-request trapped or injured counts, so it cannot calibrate a per-request rule. Presenting a table as derived from it would be false precision in the paper.
### Options Considered
A lookup table per (hazard, trapped band, injured band); an additive points rule; a weighted formula rounded to 1-5.
### Decision
An additive points rule:

`severity = min(5, 1 + trapped_points + injured_points + hazard_points)`

- trapped: 0 → 0, 1-2 → 2, 3-5 → 3, ≥6 → 4
- injured: 0 → 0, 1-2 → 1, 3-5 → 2, ≥6 → 3
- hazard: Flood → 0, Landslide → +1
- **A blank count scores 0.** People trapped and people injured are optional in F1.
### Reasoning
Additive points are monotonic in every input by construction, saturate cleanly at 5, and fit in two lines of a paper. A full lookup table over two hazards and four bands each is 32 rows that a reader cannot check by eye and that is easy to make non-monotonic by accident.

Trapped is weighted above injured because entrapment is time-critical in a way that injury alone is not. Landslide carries +1 over flood because burial and crush injury give a much shorter survival window than flood isolation, which matches Uttarakhand case-fatality patterns.

Blank counts score 0 rather than assuming a casualty: it is the simpler rule to state and defend, and scoring an unknown above a confirmed zero needs a justification this project cannot supply from data.
### Trade-offs
**The blank-count rule is the weak point and was flagged to the owner before it was adopted.** People trapped and injured are optional on an emergency form, so a citizen submitting only location, hazard and phone gets severity 1 for a flood or 2 for a landslide. If most real submissions look like that, the queue clusters at the bottom and separation comes from Vul, Wait and commander override instead of severity. Phase 6 should measure this on the scenario data; if the queue is flat, either score a blank count as 1 point or make the fields required (which is a PRD change to F1, not a rule change).

The table is authored from reasoning, not from domain consultation or data. Paper Part 2 must describe it that way and must not claim it was derived from the EM-DAT records.
### Consequences
PRD F5 now carries the table, marked `[Provisional]`. Open item 1 is closed; the entry is added to the Provisional list for Phase 6. Phase 2 can implement `api/src/scoring/` and the AC3 unit test against it. Open items 2, 3 and 6 (severity scaling, team score formula, Freshness window) are still open and still block Paper Part 2.
### Alternatives Rejected
A 32-row lookup table (unreadable, easy to break monotonicity); a weighted continuous formula rounded to 1-5 (harder to explain and to test for AC3); deriving a table from `disasterIND.csv` (the data does not support it); waiting for domain consultation past the Sep 25 fallback date.

## D-048 December exam overlap: move the risky work to November, freeze to Jan 17

### Date
2026-09-22
### Status
Accepted. Amends the `PLAN.md` phase boundaries set on 2026-09-15.
### Context
`PLAN.md` carried a risk row saying: confirm the December university exam dates, and if they overlap Phase 4, pull Phase 4 work forward and move the feature freeze no later than Jan 17. On 2026-09-22 the owner confirmed **there are exams in December, but the dates are not decided**. Phase 4 ran Nov 30 - Dec 27, so an overlap is close to certain. The dates may not be published until November, which is inside Phase 3.
### Options Considered
1. Wait for the dates before changing anything.
2. Pull the risky work forward but keep the Jan 10 freeze.
3. Pull the risky work forward **and** move the freeze to Jan 17.
### Decision
Option 3.
- **F7 (recommendation endpoint) and F9 (the two-level decision service) move from Phase 4 into Phase 3**, server-side only, driven by integration tests with no UI. **AC11 and AC22 now close in Phase 3.**
- **Phase 4 becomes the UI phase** and is marked reduced capacity. It gets a written cut order: F13 first, then the Admin weights editor, then F12 on secondary screens. **F8 is never cut.**
- **Feature freeze moves Jan 10 to Jan 17.** Phase 5 becomes Dec 28 - Jan 17; Phase 6 becomes Jan 18 - Jan 31, two weeks instead of three.
- **Scenario datasets and ground truth start in Phase 3**, not Phase 4.
### Reasoning
The split is by **interruptibility, not by size**. AC11 and AC22 are the project's hardest guarantees: no assignment may exist without an approved selection, and the assignment plus its audit entry must commit in one transaction. That is transactional database work needing sustained concentration and a full integration-test harness. It is exactly the work that goes wrong when done in hours snatched between exams, and it is the work whose failure invalidates the project's central claim. UI work over an already-tested service degrades gracefully: a half-finished panel is visibly half-finished, whereas a half-correct approval path looks fine and is not.

Waiting for the dates was rejected because the information arrives too late to act on. Keeping the Jan 10 freeze was rejected because it leaves no slack if exams take more of December than expected, and a slipped freeze with no buffer runs straight into Paper Part 3.
### Trade-offs
**Phase 6 drops to two weeks**, and it has to produce SM1-SM5 and Paper Part 3. This is now the sharpest risk in the plan. It is mitigated by starting scenario data in Phase 3 - the plan already noted that the data takes longer than the code - but the mitigation is only as good as owner B actually starting it in November.

Phase 3 becomes the heaviest phase in the plan: F1-F6, two languages, mobile screens, plus F7 and F9. If Phase 3 slips, the December squeeze happens anyway and with less warning. Watch Phase 3 closely in mid-November.

**If the January deadline turns out to be earlier than Jan 31, the freeze must move back again.** Phase 6 cannot absorb another cut.
### Consequences
`PLAN.md` updated: the overview table, the freeze date, Phases 3, 4, 5 and 6, and the exam and January-deadline risk rows. The exam risk row stays open until the dates are published, at which point the assumption is checked rather than the plan re-made.
### Alternatives Rejected
Waiting for the exam dates; front-loading without moving the freeze; compressing Phase 5 instead of Phase 6 (Phase 5 carries the deployment and the last two acceptance criteria, so it has no slack either).

## D-049 Evaluation protocol: who does each job

### Date
2026-09-22
### Status
Accepted. Closes the open evaluation-method item that `PLAN.md` Phase 1 listed as decision 5.
### Context
`PRD.md` commits to reporting SM1-SM5, and the project synopsis (Section 4.9) already published the *shape* of the evaluation: ground-truth assignments from simulated scenarios, a manual coordination baseline on the same scenarios, and a standard usability questionnaire given to evaluators acting as commanders. The paper must stay consistent with that. What was never settled is **who performs each job**, and the owner asked three times what that question even meant. For SM1 and SM2 the answer decides whether the results mean anything.
### Options Considered
Leave staffing until Phase 6; assign people now; or fix the **roles and their constraints** now and the names later.
### Decision
Fix the roles and constraints now; assign names in Phase 4. Written into `PRD.md` under Success Metrics as "Evaluation Protocol".
- **SM2:** the scoring author (owner B, who writes `api/src/scoring/`) **must not** build the ground truth. Graded relevance (ideal / acceptable / wrong), from a written rubric fixed before anyone sees system output, labelled independently by two people, with **Cohen's kappa reported**.
- **SM1:** two team members run the manual baseline by messaging group and spreadsheet, including both approval steps, **before** using RescueAI on those scenarios; scenario order counterbalanced; **the Render instance warmed before every timed run**; both medians reported, not only the gap.
- **SM3:** 8-12 evaluators, **none on the team**. Classmates acceptable, faculty better, serving SDRF/NDRF personnel best. The evaluator mix is reported.
- **SM4, SM5:** computed from the audit export. No evaluators.
### Reasoning
The decisive risk is **circularity in SM2**. If the person who wrote the ranking formula also decides which volunteers "should" have been ranked highest, Precision@5 measures the author's consistency with themselves, not the system's quality. It reliably produces a near-perfect score and is the most common flaw in student ranking evaluations; a Scopus reviewer will find it. Separating the roles costs nothing, and reporting inter-rater agreement converts the weakest part of the method into something defensible.

The SM1 ordering constraint addresses the mirror problem: a manual baseline run by someone who has already seen RescueAI solve those scenarios is artificially fast, which understates the gap, or artificially slow if they know the thesis. Running manual first, with counterbalanced order, removes the learning effect.

The Render warm-up is not a detail. SM1 is a **median time** measurement on a free instance that sleeps after about 15 minutes and cold-starts in roughly 50 seconds (D-044). One unwarmed run can move the median more than the system does.

Roles rather than names, because `PLAN.md` assigns owners A, B and C only provisionally and the team may reallocate. The constraints are what must survive.
### Trade-offs
Two independent labellers over every request in every scenario is real work, on a Phase 6 that D-048 cut to two weeks. This is why D-048 moved scenario and ground-truth work into Phase 3.

Team members evaluating their own project is weak for SM3 even when they are not the authors; classmates share the same background and inflate usability scores. This is a stated limitation unless the mentor can reach real responders.

SM1 with only two baseline operators is a small sample. The honest framing in the paper is an indicative comparison, not a controlled trial.
### Consequences
`PRD.md` Success Metrics now carries the protocol; Paper Part 2 (Oct 20) can describe the evaluation method concretely. Phase 4 must assign the actual names, and Phase 6 must warm the service before every timed run. `PLAN.md` Phase 1 decision 5 is closed.
### Alternatives Rejected
Deferring all of it to Phase 6 (too late to change who writes the scoring code); naming people now (premature, and the constraints matter more than the names); dropping the manual baseline and reporting RescueAI timings alone (SM1 is defined as a comparison, and an absolute number proves nothing).

## D-050 Commander role boundaries, and closing the self-approval hole

### Date
2026-09-22
### Status
Accepted. Closes PRD open items 4 and 5, and extends AC22.
### Context
Two PRD assumptions were open: whether any shared commander action belongs to only one commander type (item 4), and whether the office commander can edit a selection rather than only approve or send it back (item 5). Reviewing them surfaced a third problem that neither item asked about.
### Options Considered
Item 4: keep all shared actions shared, or restrict some (for example team records and skill verification) to the office commander. Item 5: approve-as-sent only, allow editing, or allow partial approval of some responders.
### Decision
- **Item 4: all six shared actions stay shared** - verify skills, manage team records, override severity, withdraw offers, request volunteer locations, resolve or cancel requests.
- **Item 5: the office commander approves exactly as sent**, and to change a selection they send it back. **Approval is all-or-nothing**; there is no partial approval.
- **New, not asked for:** the two level-specific actions are exclusive **in both directions**, and **the selector and approver must be different user accounts**, enforced server-side. The Admin must not give one person both commander roles. AC22 now covers all of this.
### Reasoning
**Item 4.** None of the six shared actions creates an offer or a deployment, so none can bypass approval. Withdrawing an offer removes rather than creates, so it cannot dispatch anything. Restricting any of them would only block whichever commander happens to be available, which in a disaster is the wrong trade.

**Item 5.** Editing destroys authorship. The audit log exists to answer who decided what (AC11, AC22, SM4); if the office commander can add or remove responders, no one can say who chose a given responder. It also matches the real chain of command: the on-site commander knows who is actually reachable, and an office commander swapping responders from a distance is the failure mode two-level approval is meant to prevent. Building it is worse too - an edit path is a second way to author a selection, which would itself need approving, collapsing the two levels. Send-back costs seconds at 5-second polling. Partial approval was rejected for the same reason: it is editing under another name.

**The hole.** AC22 said an on-site commander cannot approve. **Nothing said an office commander cannot select.** As written, an office commander could create a selection and approve it, producing two audit entries from one actor - satisfying the wording of AC11 while defeating its purpose, with SM4 reporting full compliance on a self-approved dispatch. The same-account rule is the more important half: the project will be demonstrated with a handful of seeded accounts, and giving one demo account both roles is exactly the shortcut that voids the central claim.
### Trade-offs
An office commander who spots one wrong responder among four must send the whole selection back rather than fix it. That is the intended cost: the on-site commander should make the swap, and the round trip is seconds.

The different-accounts rule means a genuine two-person chain cannot be simulated by one person with one login, including during a demo or a hurried evaluation run. That friction is the point.
### Consequences
`PRD.md` updated in three places: Target Users, F9 and AC22. Open items 4 and 5 are closed. `TESTING.md` extends the required AC22 integration tests with three new cases, including approval by the creating account. Phase 3 now has to enforce this in `services/decisions` when F9 moves there (D-048).
### Alternatives Rejected
Restricting team records or skill verification to the office commander (blocks the available commander for no safety gain); letting the office commander edit a selection (destroys authorship, needs a second approval level); partial approval (editing by another name); leaving the mirror and same-account rules unstated (the demo path most likely to be taken is the one that breaks the thesis).
