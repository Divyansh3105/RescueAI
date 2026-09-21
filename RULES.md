# Project Rules

These are the coding rules the team adopted on 2026-09-11. No code exists yet, so they are adopted decisions, not patterns taken from existing code. Update this file when engineering practices change.

This file covers **how to write code**. For everything else, see:
- `PRD.md` for what to build
- `ARCHITECTURE.md` for how the system is structured
- `DESIGN.md` for how the UI looks
- `AGENTS.md` for the agent workflow

## General Rules

- **Use the PRD formulas exactly** (Eq. 4.1 and 4.2, and the severity rule in F5). Changing a formula requires a PRD change first.
- **Tie work to the PRD.** Every change should trace to a PRD feature (F1–F14) or acceptance criterion (AC1–AC25). Reference the ID in the PR description.

## Code Organization

Layout: `web/` (React SPA) and `api/` (Express API). See `ARCHITECTURE.md` → Repository Structure.

- **`api/src/routes/`** handles HTTP only: the auth/role guard, zod validation, and building the response. No SQL and no business rules.
- **`api/src/services/`** holds business rules and transactions. It is the only layer that calls `db/`.
- **`api/src/scoring/`** is pure functions only.
  - It never imports from `db/`, `routes/` or `services/`.
  - It never reads the clock or uses randomness. The caller passes in `now`.
- **`api/src/services/decisions`** is the **only** module allowed to create assignments or set a team to Deployed. It does so only when an office commander approves a selection made by an on-site commander.
- **`api/src/db/`** holds the Drizzle schema, queries and migrations.
- **`web/src/components/ui/`** holds shadcn/ui components, added with the shadcn CLI. Edit them only to apply design tokens globally, never for a single page.

## Naming Conventions

- **Files:** kebab-case, e.g. `rescue-request.ts`, `score-breakdown.tsx`.
- **Code:** React components, types and interfaces use PascalCase. Variables and functions use camelCase.
- **Database:** tables and columns use snake_case. TypeScript uses camelCase, with the mapping done by Drizzle.
- **Domain terms come from the PRD, word for word:**
  - Entities: RescueRequest, Selection, Assignment, Volunteer, Team, OnSiteCommander, OfficeCommander, Admin, AuditEntry, LocationRequest. "Commander" means either commander type.
  - Don't use synonyms such as "incident", "task", "job" or "dispatcher".
- **Status values are snake_case strings:**

  | Entity | Values |
  |---|---|
  | Request | `pending`, `in_progress`, `resolved`, `cancelled` |
  | Assignment | `offered`, `accepted`, `declined`, `completed`, `withdrawn` (volunteer); `deployed`, `completed` (team) |
  | Skill | `unverified`, `verified`, `rejected` |
  | Team | `available`, `deployed`, `unavailable` |
  | Volunteer availability | `available`, `unavailable` |
  | Selection | `awaiting_approval`, `approved`, `sent_back` |
  | User role | `volunteer`, `onsite_commander`, `office_commander`, `admin` |

- **Scoring factor names:**
  - Volunteer score: `skill`, `proximity`, `freshness`, `reliability`.
  - Priority score: `severity`, `vulnerability`, `wait`.
  - These same names are used in code, in API responses and in the ScoreBreakdown UI.

## Type Safety

- **Strict TypeScript.** Use `"strict": true` in both `web/` and `api/`.
- **No `any`.** Use `unknown` and narrow it. No `as any`, `@ts-ignore` or `@ts-nocheck`.
- **Validated input types come from zod** via `z.infer<typeof schema>`. Never hand-write a duplicate type.
- **Database row types come from the Drizzle schema.** Never hand-write row interfaces.

## Error Handling

- **Audited actions are all-or-nothing.** Every audited action and its audit row run in one `db.transaction`. Never catch an error inside it and carry on; let the whole transaction roll back.
- **API error format:** every error response uses `{ error: { code, message, fields? } }` (D-035; see `ARCHITECTURE.md` → API Architecture). `code` is a stable string the UI can translate, and `fields` holds per-field validation messages. Never put stack traces, SQL or internal IDs of other users into error responses.
- **Client-side errors:** follow `DESIGN.md` → Error States. A failed submit never clears form data.

## API Rules

- **Every route declares its access and its input schema:**
  - access is either `public` or an explicit list of allowed roles
  - input is validated by a zod schema
- **Only two routes are public:** request submission (PRD F1) and login. Adding another public route requires a PRD change.
- **Never return a database row directly.** Build each response object explicitly for the caller's role. This stops accidental leaks of password hashes, phone numbers or locations (AC14, AC18).
- **Personal data goes only to commanders.** Citizen phone numbers and volunteer coordinates appear only in commander responses. Never put them in volunteer or Admin responses, audit snapshots or CSV exports.
- **GET requests have no side effects,** with one exception: recording `first_recommended_at` the first time recommendations are fetched (PRD F14).
- **Scores are computed when read and never stored.** The only exception is the snapshot saved in an AuditEntry.

## Database Rules

- **All schema changes go through drizzle-kit migrations** committed to the repo.
  - Never edit a migration that has already been applied.
  - Never change the schema by hand on a server.
- **Write these in raw SQL inside migrations:**
  - grants
  - CHECK constraints
  - the partial unique index for "one active assignment per responder"
- **Never update or delete audit rows.** The app's DB role has only INSERT and SELECT on the audit table. No migration, seed script or query may update or delete audit rows.
- **Scenario and seed data are synthetic only** (see PRD Technical Constraints). Never load real personal data.

## Security Rules

These are implementation rules. The requirements themselves are in `AGENTS.md` → Security Requirements.

- **Auth:** server-side sessions stored in PostgreSQL, with an httpOnly, Secure, SameSite cookie. Never put session IDs or tokens in `localStorage` or `sessionStorage`, or send them in response bodies.
- **Passwords:** hash with bcrypt. Never log or return password hashes.
- **SQL:** always through Drizzle or its parameterized `sql` template. Never build SQL by string concatenation.
- **Logs:** never write citizen phone numbers, volunteer locations, passwords or session IDs to logs.
- **Secrets:** read from environment variables. Never commit `.env` files.

## Dependency Rules

- **npm only.** Commit `package-lock.json`. No yarn or pnpm lockfiles.
- **One tool per job.** Do not add an alternative to an adopted tool:

  | Job | Tool |
  |---|---|
  | Server state | TanStack Query |
  | Validation | zod |
  | Database | Drizzle ORM + drizzle-kit |
  | Maps | Leaflet |
  | UI components | shadcn/ui |
  | Tests | Vitest |
  | Lint / format | ESLint + Prettier |
  | Frontend build | Vite |
  | Reverse proxy | Caddy |

- **No Python dependencies in the MVP** (see `ARCHITECTURE.md` → System Boundaries).
- **New frameworks, databases or external services need the user's approval** first (see `AGENTS.md`).

## UI Rules

- **Read `DESIGN.md` before any UI change.** It is the complete UI rulebook, so this file does not repeat it.
- **Citizen and volunteer screens never hard-code user-facing text.** Every string comes from the `en` and `hi` dictionaries, and both dictionaries have the same keys. Commander and Admin screens are English only. (Plain dictionaries with no i18n library: Decided, AD15 / D-040.)

## State Management

- **Server data is accessed only through TanStack Query hooks.** Never copy query data into `useState`.
- **Polling:** live screens use `refetchInterval` of about 5000 ms. The live screens are the queue, the map, request detail and volunteer offers. Don't poll other screens.
- **After a mutation, invalidate the affected queries.**
- **No optimistic updates for decisions or assignments.** The UI must not show "approved", "offer sent" or "accepted" until the server has committed.
- **UI-only state** goes in `useState`. **Shareable view state** (the selected request, filters) goes in URL parameters.
- **No global store** (Redux, Zustand, or Context holding server data).

## Testing Rules

The full testing strategy is in **`TESTING.md`**: the tools, the required tests, mocking, test data, naming and the Definition of Done. The one rule kept here:
- **A PR merges only when lint, type-check and all tests pass.**

## Git Rules

The git repository is not initialized yet. Once it is:

- **Branches:** short-lived feature branches off `main`. `main` must always be deployable.
- **Review:** every change goes through a PR reviewed by one teammate before it is merged. Never force-push to `main`.
- **Commits:** use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Never commit:** `.env` files, secrets, or database dumps.
- **AI agents:** do not commit, push or merge unless the user asks.

## Performance Rules

- **Polled endpoints must not have N+1 queries.**
  - Load each list with one query.
  - Ranking loads all eligible responders in one query, then scores them in memory.
- **No caching layers, queues or extra infrastructure** (for example Redis). The single-VM architecture in `ARCHITECTURE.md` rules them out unless it is changed.

## Forbidden Practices

- `any`, `as any`, `@ts-ignore`, `@ts-nocheck`, or `eslint-disable` used to get past a check.
- Creating an assignment or deploying a team anywhere outside `services/decisions`, or without an approved selection.
- Citizen phone numbers or volunteer coordinates in volunteer or Admin responses, audit snapshots or CSV exports.
- Hard-coded user-facing text on citizen or volunteer screens.
- UPDATE or DELETE on audit rows, anywhere: code, migrations or seeds.
- SQL in routes, SQL built by string concatenation, or returning database rows directly in responses.
- Clock or randomness access inside `scoring/`.
- Auth tokens or session IDs in web storage. Personal data in logs.
- Optimistic UI for decisions or assignments.
- Editing applied migrations, or changing the schema by hand.
- Adding an alternative to an adopted tool (for example Redux, Jest, Prisma, another UI kit, yarn or pnpm).
- Force-pushing to `main`, merging without review, or committing secrets.
