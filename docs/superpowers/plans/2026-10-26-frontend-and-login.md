# Frontend Screens and Working Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Progress Report 1 prototype with the real route-based frontend: every MVP screen for all five roles exists and is reachable, and **login works end to end** (phone + password → server session cookie → role-guarded shells). Every other screen renders sample data and does not call the API yet.

**Architecture:** The API gains the first two tables (`users`, `sessions`), bcrypt password checks and three auth routes, following the decided auth design (server-side sessions in PostgreSQL, httpOnly cookie, 12-hour session, D-037, AD9). The SPA gets a tiny History-API router, a TanStack Query session hook, one shell per role (DESIGN.md → Layout) and one page component per screen. The prototype's components and sample data move into the new pages; the prototype switcher is deleted.

**Tech Stack:** React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query, Leaflet (web). Express 5, zod, Drizzle + postgres.js, `bcryptjs` (api). Vitest + supertest.

**Spec:** `docs/PRD.md` (F2 login, AC18, AC21, AC24, AC25), `docs/DESIGN.md` (all of it), `docs/ARCHITECTURE.md` → Security Architecture, `docs/RULES.md`, `docs/TESTING.md`.

## Decisions this plan makes (confirm before Task 1)

1. **Client routing: a ~40-line in-house router** on the History API (`web/src/router.tsx`), not React Router. No router is adopted in RULES.md, and adding one needs approval. If you'd rather have React Router, say so: only Task 4 changes.
2. **`bcryptjs`, not `bcrypt`.** Same algorithm (bcrypt is Decided), pure JS, so the `node:24-alpine` image needs no native build tools. Cost factor 12.
3. **Session tokens are stored as SHA-256 hashes.** The cookie holds 32 random bytes (base64url); the `sessions` row holds only `sha256(token)`. A leaked database then can't be replayed as logins. Recorded as D-052.
4. **Migrations run at API start-up** (`drizzle-orm` migrator in `src/index.ts`), so Render applies them on deploy without a shell. The Dockerfile copies `api/drizzle/`.
5. **Demo accounts come from a seed script** (`npm run db:seed`) with the password taken from `SEED_PASSWORD`. No password is ever committed.
6. **No GSAP / Lenis / React Bits.** Your global UI default conflicts with `docs/DESIGN.md` (“no decorative motion”, “don't use a different component library alongside shadcn/ui”), which is the project's owner-approved rulebook. The project doc wins unless you say otherwise.
7. **Admin gets its own section list** (Commanders, Users, Weights, Data, Audit Log) and **not** the Queue/Map/Volunteers screens: AC18 says the Admin never sees citizen phones or volunteer locations, and those screens are built around them. DESIGN.md says "commander shell plus…", which is ambiguous; this is the safe reading.
8. **Login has no rate limit in this plan.** Nothing in the docs decides one (D-036 covers only the public request form). bcrypt cost 12 slows guessing. Add one when the team decides a number.

## Global Constraints

- Login is by **phone number and password**; passwords are **at least 8 characters**; a session lasts **12 hours** (D-037). The expiry is fixed from login, not sliding.
- Phone format: a 10-digit Indian mobile, `/^[6-9]\d{9}$/`, after stripping spaces, dashes and a leading `+91` or `0`.
- Roles exactly: `volunteer`, `onsite_commander`, `office_commander`, `admin` (RULES.md naming). Citizens have no account.
- Cookie: name `sid`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` when `NODE_ENV=production`, `Max-Age` 43200 s. Never in `localStorage`, never in a response body (RULES.md → Security).
- Error shape `{ error: { code, message, fields? } }` (D-035). Codes used here: `validation_failed`, `invalid_credentials`, `unauthenticated`, `forbidden`.
- Wrong phone, wrong password and deactivated account all return the **same** 401 `invalid_credentials` body.
- Never return a DB row directly; never log phones, passwords or session tokens.
- Citizen, volunteer **and login** screens: every string from the `en`/`hi` dictionaries, identical keys (AC24). Commander and admin screens: English only.
- DESIGN.md is binding: tokens only, no arbitrary Tailwind values, `lg` 44px buttons on citizen/volunteer/login screens, visible labels, errors below fields with `aria-describedby`, focus first invalid field, never clear a form on failure, skip link on every shell with navigation, one `h1` per page, `lang` on `<html>`.
- No component tests (D-038). Web tests cover pure functions only. API auth is covered by integration tests against real PostgreSQL.
- Work on a new branch `feat/frontend-and-login` off `main`. Do not commit to `main`; no `Co-Authored-By` lines (user preference).

## Review Focus

1. **Open redirect through `?next=`.** `/login?next=//evil.com` or `next=https://evil.com` must land on the role home, not leave the site. Test in Task 4 (`safeNext`).
2. **Logged-in user opens another role's URL** (volunteer types `/commander/queue`). Expected: redirected to their own home, never a flash of commander UI. The UI guard is cosmetic; the API guard is the real one (Task 2 `requireRole` test).
3. **Expired or deleted session while a page is open.** `/api/auth/me` returns 401 → the user lands on `/login?next=<current path>`, not a blank screen or a retry loop. Test in Task 2 (expired session → 401) and the 401 handling in Task 4.
4. **Phone typed with `+91`, spaces or a leading 0** must log in the same account as the bare 10 digits. Test in Task 2 (`normalizePhone`).
5. **Network failure or 500 on submit** keeps both fields filled and shows a retryable form-level Alert, never a raw code (DESIGN.md → Error States). Verified manually in Task 5 by stopping the API.

---

## File Structure

**api/** (new or changed)
```
src/db/schema.ts            users, sessions tables + userRole enum
src/db/seed.ts              demo accounts, one per role (SEED_PASSWORD)
src/db/migrate.ts           runMigrations(): drizzle migrator on ./drizzle
src/index.ts                await runMigrations() before listen
src/env.ts                  + isProduction
src/auth/phone.ts           normalizePhone()
src/auth/phone.test.ts
src/auth/sessions.ts        service: verifyLogin, createSession, findSession, deleteSession
src/auth/middleware.ts      loadSession, requireRole
src/routes/auth.ts          POST /login, POST /logout, GET /me
src/routes/auth.test.ts     integration tests (real PostgreSQL)
src/test/global-setup.ts    run migrations once against DATABASE_URL
src/test/reset.ts           truncateAll() between test files
src/app.ts                  mount loadSession + /api/auth
drizzle/                    generated migration 0000
vitest.config.ts            globalSetup, fileParallelism: false
```
**web/** (new or changed)
```
src/lib/api.ts              apiFetch, ApiError
src/router.tsx              usePath, navigate, Link
src/routes.ts               Role, homeFor, safeNext, route table
src/routes.test.ts
src/auth/session.ts         useSession, useLogin, useLogout
src/auth/RequireRole.tsx    guard
src/i18n/dictionaries.ts    en/hi (moved from prototype, + login keys)
src/i18n/dictionaries.test.ts   AC24 key parity
src/i18n/use-lang.ts        useLang() (state + <html lang>)
src/components/             PriorityBadge, StatusBadge, SkillChip, ScoreBreakdown,
                            RecommendationCard, LangSwitch, SampleDataNote, PageSpinner
src/sample/                 data.ts (moved from prototype/data.ts)
src/shells/                 CitizenShell, VolunteerShell, CommanderShell (also admin)
src/pages/login/LoginPage.tsx
src/pages/citizen/          RequestPage
src/pages/volunteer/        RegisterPage, HomePage, ProfilePage, HistoryPage
src/pages/commander/        QueuePage, MapPage, VolunteersPage, TeamsPage, AuditPage
src/pages/admin/            CommandersPage, UsersPage, WeightsPage, DataPage
src/pages/NotFoundPage.tsx
src/App.tsx                 route table → shell + page
src/prototype/              deleted at the end (Task 10)
```

### Route table (Task 4 produces it; pages fill it)

| Path | Access | Shell | Page | Works? |
|---|---|---|---|---|
| `/` | public | Citizen | RequestPage | sample (submit shows confirmation, no API) |
| `/login` | public (signed-in → home) | none | LoginPage | **yes** |
| `/register` | public | Citizen | RegisterPage (volunteer sign-up, F2) | sample |
| `/volunteer` | volunteer | Volunteer | HomePage (banner, availability, offer/assignment) | sample |
| `/volunteer/profile` | volunteer | Volunteer | ProfilePage (skills + status) | sample |
| `/volunteer/history` | volunteer | Volunteer | HistoryPage | sample |
| `/commander/queue` | onsite, office | Commander | QueuePage (split view, `?r=<id>`, office `?filter=awaiting`) | sample |
| `/commander/map` | onsite, office | Commander | MapPage (Leaflet, lazy) | sample |
| `/commander/volunteers` | onsite, office | Commander | VolunteersPage (skill verification) | sample |
| `/commander/teams` | onsite, office | Commander | TeamsPage | sample |
| `/commander/audit` | onsite, office | Commander | AuditPage | sample |
| `/admin/commanders` | admin | Commander | CommandersPage (create/deactivate) | sample |
| `/admin/users` | admin | Commander | UsersPage (password reset, AC25 UI) | sample |
| `/admin/weights` | admin | Commander | WeightsPage (w1–w4, α β γ, sums to 1) | sample |
| `/admin/data` | admin | Commander | DataPage (scenario load, CSV export) | sample |
| `/admin/audit` | admin | Commander | AuditPage (same component) | sample |
| anything else | public | none | NotFoundPage | yes |

`homeFor`: volunteer → `/volunteer`; onsite/office → `/commander/queue`; admin → `/admin/commanders`.

---

### Task 1: Users and sessions schema, migrations, integration-test harness

**Files:**
- Modify: `api/src/db/schema.ts`, `api/src/index.ts`, `api/package.json` (scripts), `Dockerfile` (copy `api/drizzle`)
- Create: `api/src/db/migrate.ts`, `api/drizzle/0000_*.sql` (generated), `api/vitest.config.ts`, `api/src/test/global-setup.ts`, `api/src/test/reset.ts`, `api/src/db/schema.test.ts`

**Interfaces:**
- Produces: `users` table (`id uuid pk default gen_random_uuid()`, `name text not null`, `phone text not null unique`, `passwordHash text not null`, `role userRole not null`, `active boolean not null default true`, `createdAt timestamptz not null default now()`); `sessions` table (`tokenHash text pk`, `userId uuid not null references users on delete cascade`, `expiresAt timestamptz not null`, `createdAt timestamptz not null default now()`); `userRole` pg enum with the four roles; `type UserRole`.
- Produces: `runMigrations(): Promise<void>`; `truncateAll(): Promise<void>` (test-only, `TRUNCATE users, sessions CASCADE`).

- [ ] **Step 1:** Write `schema.test.ts`: `it('rejects a second user with the same phone')` inserts two users with phone `9000000001` and expects the second insert to throw (unique violation `23505`). Call `truncateAll()` in `beforeEach`.
- [ ] **Step 2:** Run `npm test` in `api/` against local Docker PG (`docker compose up db -d`, `DATABASE_URL=postgres://rescueai:<pw>@localhost:5432/rescueai_test`). Expected: FAIL, `users` does not exist.
- [ ] **Step 3:** Write the schema, run `npm run db:generate`, add `runMigrations` (`migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../drizzle') })`), call it in `index.ts` before `listen`. `vitest.config.ts`: `globalSetup: ['src/test/global-setup.ts']`, `fileParallelism: false`.
- [ ] **Step 4:** Run `npm test`, `npm run lint`, `npm run typecheck`. Expected: PASS (health tests still pass).
- [ ] **Step 5:** `docker compose up --build` → `/api/health` returns `{"status":"ok","db":"up"}` and the log shows migrations applied. Commit `feat(api): add users and sessions tables with migrations`.

The test DB uses the same role as the app for now; the separate truncate role (D-038) becomes necessary when the audit table lands. Note it in TESTING.md in Task 10.

### Task 2: Login, logout, current session

**Files:**
- Create: `api/src/auth/phone.ts`, `api/src/auth/phone.test.ts`, `api/src/auth/sessions.ts`, `api/src/auth/middleware.ts`, `api/src/routes/auth.ts`, `api/src/routes/auth.test.ts`
- Modify: `api/src/app.ts`, `api/src/env.ts`, `api/package.json` (`bcryptjs`)

**Interfaces:**
- Consumes: Task 1 tables, `truncateAll`.
- Produces:
  - `normalizePhone(raw: string): string | null`
  - `verifyLogin(phone: string, password: string): Promise<PublicUser | null>` — compares against a fixed dummy hash when the phone is unknown, so timing doesn't reveal which phones exist.
  - `createSession(userId: string): Promise<{ token: string; expiresAt: Date }>`; `findSession(token: string): Promise<PublicUser | null>` (null if expired or user inactive); `deleteSession(token: string): Promise<void>`
  - `type PublicUser = { id: string; name: string; role: UserRole }` — the only user shape any response uses.
  - `loadSession: RequestHandler` sets `res.locals.user: PublicUser | undefined` from the `sid` cookie (parse `req.headers.cookie` by hand; no cookie-parser).
  - `requireRole(...roles: UserRole[]): RequestHandler` → 401 `unauthenticated` without a user, 403 `forbidden` with the wrong role.
  - Routes: `POST /api/auth/login` body `{ phone: string, password: string }` → 200 `{ user: PublicUser }` + `Set-Cookie: sid=…`; `POST /api/auth/logout` → 204, clears cookie, deletes row; `GET /api/auth/me` → 200 `{ user }` or 401 `unauthenticated`.

- [ ] **Step 1: Write the failing tests.** `phone.test.ts`: `'9876543210'`, `'+91 98765 43210'`, `'098765-43210'` all → `'9876543210'`; `'12345'` and `'5876543210'` → `null`.
  `auth.test.ts` (each creates its own user with `bcryptjs.hash('correct-horse', 4)`):
  - `AC18: login with the right password sets an httpOnly SameSite=Lax sid cookie and returns only id, name, role` — assert body keys are exactly `['id','name','role']` and no `passwordHash`/`phone`.
  - `login accepts +91 and spaces in the phone number`
  - `wrong password, unknown phone and deactivated user return the same 401 invalid_credentials body`
  - `missing or 7-character password returns 400 validation_failed with fields.password`
  - `me returns the user with the cookie and 401 unauthenticated without it`
  - `an expired session returns 401` — set `expiresAt` to the past directly in the DB.
  - `logout deletes the session; the old cookie then gets 401 from me`
  - `the sessions table stores a hash, not the cookie value`
  - `requireRole returns 403 forbidden for the wrong role and 401 without a session` — mount `requireRole('admin')` on a throwaway express app inside the test with `loadSession`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement. Validate the body with zod (`phone` string → `normalizePhone` refine; `password` min 8). bcrypt cost 12 in production code. Token: `randomBytes(32).toString('base64url')`; store `createHash('sha256')`. Mount `app.use(loadSession)` before the API routes and `app.use('/api/auth', authRouter)` before the 404 handler.
- [ ] **Step 4:** Run `npm test`, `npm run lint`, `npm run typecheck`. Expected: PASS, 0 lint errors.
- [ ] **Step 5:** Commit `feat(api): phone and password login with server sessions`.

### Task 3: Demo accounts seed

**Files:**
- Create: `api/src/db/seed.ts`
- Modify: `api/package.json` (`"db:seed": "tsx src/db/seed.ts"`), `.env.example` (`SEED_PASSWORD=`)

**Interfaces:**
- Produces four accounts, upserted by phone (re-running updates the hash, never duplicates):

  | Phone | Name | Role |
  |---|---|---|
  | 9000000001 | Demo Volunteer | volunteer |
  | 9000000002 | Demo On-site Commander | onsite_commander |
  | 9000000003 | Demo Office Commander | office_commander |
  | 9000000004 | Demo Admin | admin |

- [ ] **Step 1:** Implement: exit with a clear message if `SEED_PASSWORD` is missing or shorter than 8; hash with cost 12; `onConflictDoUpdate` on phone.
- [ ] **Step 2:** Run `SEED_PASSWORD=<local value> npm run db:seed` twice against local Docker PG; then `select phone, role from users` shows exactly 4 rows.
- [ ] **Step 3:** `curl -i -X POST localhost:3000/api/auth/login -H 'content-type: application/json' -d '{"phone":"9000000004","password":"<value>"}'` → 200 with `Set-Cookie: sid=…; HttpOnly; SameSite=Lax`.
- [ ] **Step 4:** Commit `feat(api): seed one demo account per role`.

Seeding the deployed Neon database is a manual step for the owner (`node --env-file=../.env.local --import tsx src/db/seed.ts` with `SEED_PASSWORD` set in the shell). Do not run it against Neon without asking.

### Task 4: API client, router, session hooks, route guard

**Files:**
- Create: `web/src/lib/api.ts`, `web/src/router.tsx`, `web/src/routes.ts`, `web/src/routes.test.ts`, `web/src/auth/session.ts`, `web/src/auth/RequireRole.tsx`, `web/src/components/PageSpinner.tsx`

**Interfaces:**
- `class ApiError extends Error { status: number; code: string; fields?: Record<string, string> }`; `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` — JSON in/out, `credentials: 'same-origin'`, throws `ApiError` (network failure → `code: 'network_error'`, status 0); 204 → `undefined`.
- `usePath(): { path: string; search: URLSearchParams }`; `navigate(to: string, opts?: { replace?: boolean }): void` (pushState + dispatches `popstate`); `<Link to className? …>` renders `<a>` and intercepts plain left-clicks only.
- `type Role = 'volunteer' | 'onsite_commander' | 'office_commander' | 'admin'`; `homeFor(role: Role): string`; `safeNext(next: string | null, role: Role): string` — returns `next` only if it starts with `/`, not `//` or `/\`, and the route table allows `role` on it; else `homeFor(role)`.
- `useSession(): { user: User | null | undefined; isLoading: boolean }` — query key `['session']`, `GET /api/auth/me`, 401 → `null`, `retry: false`, `staleTime: 60_000`, no polling.
- `useLogin()` mutation → on success `setQueryData(['session'], user)`; `useLogout()` → `queryClient.clear()` then `navigate('/login', { replace: true })`.
- `<RequireRole roles={Role[]}>` — loading → `PageSpinner`; `null` → `navigate('/login?next=' + encodeURIComponent(path), {replace})`; wrong role → `navigate(homeFor(user.role), {replace})`; renders nothing until allowed.
- Global 401: `QueryCache({ onError })` — an `ApiError` with status 401 on any query except `['session']` sets `['session']` to `null`, which triggers the guard redirect.

- [ ] **Step 1: Write the failing tests** in `routes.test.ts`:
  - `homeFor maps each role to its home` (the four pairs above)
  - `safeNext keeps an allowed same-site path` (`'/commander/map'`, onsite → same)
  - `safeNext rejects protocol-relative and absolute URLs` (`'//evil.com'`, `'https://evil.com'`, `'/\\evil.com'` → home)
  - `safeNext rejects another role's area` (`'/admin/weights'`, volunteer → `/volunteer`)
  - `safeNext with null returns home`
- [ ] **Step 2:** `npm test` in `web/`. Expected: FAIL.
- [ ] **Step 3:** Implement the files above.
- [ ] **Step 4:** `npm test`, `npm run lint`, `npm run typecheck`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(web): router, API client and session hooks`.

### Task 5: Login page (fully working)

**Files:**
- Create: `web/src/pages/login/LoginPage.tsx`, `web/src/i18n/dictionaries.ts` (moved from `prototype/i18n.ts` + login keys), `web/src/i18n/dictionaries.test.ts`, `web/src/i18n/use-lang.ts`, `web/src/components/LangSwitch.tsx` (moved)
- Modify: `web/src/App.tsx` (temporary: `/login` + a placeholder home per role, so the flow is testable before the shells exist)

**Interfaces:**
- Consumes: `useLogin`, `useSession`, `safeNext`, `navigate`, `ApiError`.
- Produces: `useLang(): [Lang, (l: Lang) => void]` (remembers the choice in `localStorage` key `lang` inside try/catch; sets `document.documentElement.lang`); `t(lang)` returns the dictionary.
- Login copy (en): title "Sign in", phone label "Mobile number (required)", hint "10-digit mobile number", password label "Password (required)", button "Sign in" / "Signing in…", errors: phone "Enter a 10-digit mobile number, for example 9876543210.", password "Password must be at least 8 characters.", 401 "The mobile number or password is wrong. Check both and try again.", network/500 "Could not reach RescueAI. Check your connection and try again.", plus a link "New volunteer? Register" → `/register` and a line "Forgot your password? Ask the Admin to reset it." (D-051). Hindi strings for every key.

- [ ] **Step 1:** Write `dictionaries.test.ts`: `AC24: en and hi have identical keys` and `no hi value is empty`.
- [ ] **Step 2:** Run → FAIL until the dictionary is moved and login keys exist in both languages; then implement the page:
  - `type="tel" inputMode="numeric" autoComplete="username"` phone; `type="password" autoComplete="current-password"` password with a show/hide toggle button (`aria-label`, `aria-pressed`).
  - Validate on submit with the same rules as the API (10 digits after normalizing, ≥ 8 chars); re-validate a field on change after the first submit; errors below fields with `aria-describedby`; focus the first invalid field.
  - On 401/network/500 show a destructive Alert at the top of the form; keep both values; focus the Alert's heading.
  - `lg` button, keeps width while loading, disabled while pending.
  - Already signed in → `navigate(homeFor(user.role), { replace: true })`. Success → `navigate(safeNext(search.get('next'), user.role), { replace: true })`.
- [ ] **Step 3:** `npm test`, lint, typecheck → PASS.
- [ ] **Step 4: Manual verification** (API + Vite dev, seeded DB) in the browser pane:
  - each of the four demo accounts lands on its home;
  - wrong password → Alert, both fields still filled;
  - `/login?next=//evil.com` → own home;
  - reload a protected page → still signed in; Logout → `/login`, back button doesn't show the protected page;
  - stop the API, submit → network Alert, values kept;
  - 375 px width, Hindi, keyboard-only sign-in; DevTools shows `sid` as HttpOnly and nothing in `localStorage` except `lang`.
- [ ] **Step 5:** Commit `feat(web): working sign-in page in English and Hindi`.

### Task 6: Shared components and the three shells

**Files:**
- Create: `web/src/components/{PriorityBadge,StatusBadge,SkillChip,ScoreBreakdown,RecommendationCard,SampleDataNote}.tsx` (moved from `prototype/parts.tsx`, one per file), `web/src/sample/data.ts` (moved), `web/src/shells/{CitizenShell,VolunteerShell,CommanderShell}.tsx`
- Modify: `web/src/App.tsx` (full route table from the table above; pages are `<h1>` stubs until Tasks 7–9)

**Interfaces:**
- `CitizenShell({ children })`: `max-w-lg` column, LangSwitch at top, no nav.
- `VolunteerShell({ title, children })`: top app bar with title, LangSwitch and a menu (Home, Profile, History, Sign out); skip link.
- `CommanderShell({ title, children })`: sidebar on `lg` (sections from `sectionsFor(role)`: commanders → Queue, Map, Volunteers, Teams, Audit Log; admin → Commanders, Users, Weights, Data, Audit Log), collapsible menu below `lg`, signed-in name + role label + Sign out, active item `aria-current="page"`, skip link, `<main id="content">`.
- `SampleDataNote`: one muted line "Sample data — not connected yet." at the top of every non-working page, so nobody mistakes a sample screen for a feature (MEMORY.md warns about this).
- Sets `document.title` to `<title> · RescueAI`.

- [ ] **Step 1:** Implement. Keep DESIGN.md patterns exactly as the prototype already does; don't restyle.
- [ ] **Step 2:** lint, typecheck, test → PASS.
- [ ] **Step 3:** Manual: every route in the table renders inside the right shell for the right role and redirects for the wrong one; the sidebar collapses below `lg`; tab order starts at the skip link.
- [ ] **Step 4:** Commit `feat(web): role shells and shared components`.

### Task 7: Citizen and volunteer pages (sample data)

**Files:**
- Create: `web/src/pages/citizen/RequestPage.tsx` (from `prototype/CitizenForm.tsx`), `web/src/pages/volunteer/{RegisterPage,HomePage,ProfilePage,HistoryPage}.tsx` (Home/History from `prototype/VolunteerHome.tsx`)
- Modify: `web/src/i18n/dictionaries.ts` (register + profile keys, en and hi)

**Interfaces:** Consumes shells, components, `sample/data.ts`, `useLang`.

- RequestPage: unchanged behaviour from the prototype (validation, Use my location, confirmation with a sample `RQ-` number). Submit does not call the API.
- RegisterPage (F2): name, phone, password (≥ 8), skills checkboxes (the PRD skill list from `sample/data.ts`), submit shows "Registration is not connected yet" in both languages. Link back to `/login`.
- HomePage: LocationRequestBanner, AvailabilitySwitch, offer → accept → assignment → mark completed, all local state.
- ProfilePage: name and SkillChips with Verified/Unverified/Rejected.
- HistoryPage: list of past assignments; empty state "Nothing recorded yet."

- [ ] **Step 1:** Implement; the AC24 key-parity test from Task 5 now covers the new keys.
- [ ] **Step 2:** lint, typecheck, test → PASS.
- [ ] **Step 3:** Manual: each page at 375 px in English and Hindi, no clipped labels; axe/Lighthouse accessibility pass on each.
- [ ] **Step 4:** Commit `feat(web): citizen and volunteer screens on sample data`.

### Task 8: Commander pages (sample data)

**Files:**
- Create: `web/src/pages/commander/{QueuePage,MapPage,VolunteersPage,TeamsPage,AuditPage}.tsx` (Queue from `prototype/CommanderQueue.tsx`, Map from `prototype/MapView.tsx`)

- QueuePage: split view on `lg`, selected request in `?r=<id>` (RULES.md: shareable view state in the URL); office commanders get the **Awaiting approval** filter as `?filter=awaiting` with the read-only panel and ApprovalBar; on-site commanders get DecisionBar with unchecked checkboxes. Decisions stay in local state, as in the prototype.
- MapPage: lazy-loaded Leaflet (`React.lazy`), legend always visible, list fallback link to the Queue.
- VolunteersPage: table of sample volunteers with skills and Verify/Reject buttons (local state); no coordinates shown.
- TeamsPage: SDRF/NDRF teams with base and capabilities.
- AuditPage: read-only table (actor, action, target, time); shared by `/admin/audit`.

- [ ] **Step 1:** Implement.
- [ ] **Step 2:** lint, typecheck, test, `npm run build` (check Leaflet is in its own chunk) → PASS.
- [ ] **Step 3:** Manual as both commander accounts: on-site can select and send; office sees Awaiting approval; Approve opens an AlertDialog; keyboard row selection with Enter works; 375 px usable.
- [ ] **Step 4:** Commit `feat(web): commander screens on sample data`.

### Task 9: Admin pages and Not Found (sample data)

**Files:**
- Create: `web/src/pages/admin/{CommandersPage,UsersPage,WeightsPage,DataPage}.tsx`, `web/src/pages/NotFoundPage.tsx`

- CommandersPage: list with role and active state; "Create commander" Dialog (name, phone, role on-site/office, temporary password); Deactivate with AlertDialog.
- UsersPage (AC25 UI): search by phone/name; "Reset password" AlertDialog → shows a sample temporary password once with a "Copy" button and the text "This password is shown only once."
- WeightsPage: two groups (w1–w4 for responder score; α, β, γ for priority) as number inputs, each group's live sum shown with `tabular-nums`; Save disabled with an inline error unless each group sums to 1.00 (±0.001). Save shows "Not connected yet".
- DataPage: scenario load (file input, accepts `.json`) and two CSV export buttons, all disabled with the SampleDataNote explaining why.
- NotFoundPage: "This page doesn't exist." + link to `/` (or to the role home when signed in).

- [ ] **Step 1:** Add `web/src/pages/admin/weights.ts` with `groupSum(values: number[]): number` and `sumsToOne(values: number[]): boolean` and a test `sumsToOne accepts 0.4+0.3+0.2+0.1 and rejects 0.5+0.5+0.1` (floating-point safe). Run → FAIL → implement → PASS.
- [ ] **Step 2:** Implement the pages.
- [ ] **Step 3:** lint, typecheck, test → PASS. Manual as admin: every admin route, and that `/commander/queue` redirects admin to `/admin/commanders`.
- [ ] **Step 4:** Commit `feat(web): admin screens on sample data`.

### Task 10: Remove the prototype, docs, final checks

**Files:**
- Delete: `web/src/prototype/`
- Modify: `AGENTS.md` (`db:seed`, `SEED_PASSWORD`, `web/src/{pages,shells,auth,i18n,sample}`, `api/src/{auth,routes}`, integration tests now exist), `docs/ARCHITECTURE.md` (auth is built; client routing choice), `docs/TESTING.md` (integration harness exists; truncate role still pending the audit table), `docs/DECISIONS.md` (D-052 session token hashing + in-house router; D-053 migrations at start-up), `docs/MEMORY.md`, `docs/DESIGN.md` (Admin section list; mark the marker shapes still Proposed), `docs/PLAN.md` (note login delivered early)

- [ ] **Step 1:** Delete the prototype; `grep -r prototype web/src` → no results.
- [ ] **Step 2:** Run in both `web/` and `api/`: `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`; `web/`: `npm run build`. Report the real output.
- [ ] **Step 3:** `docker compose up --build`, seed, then repeat the Task 5 manual checks against `http://localhost:3000` (the deployed image path: cookie, SPA fallback on deep links like `/commander/map`, migrations on boot).
- [ ] **Step 4:** Update the docs listed above.
- [ ] **Step 5:** Commit `chore: remove prototype and document login and screens`. Ask before pushing or opening the PR.

---

**Out of scope here (later phases):** any real data behind the sample screens (request intake F1, registration F2, queue F5–F6, recommendations F7–F8, decisions F9, admin APIs), the audit table, PWA install, polling.
