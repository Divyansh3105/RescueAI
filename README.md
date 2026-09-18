# RescueAI

Explainable decision support for disaster rescue and volunteer coordination.

Citizens submit rescue requests. RescueAI ranks the requests by priority and recommends the
best-matched civilian volunteers and SDRF/NDRF rescue teams for each one, showing how every
score was calculated. **Nothing is dispatched automatically:** an on-site commander selects the
responders, an office commander approves the selection, and both steps are written to an
append-only audit log.

B.Tech major project **CSE27-364**, Graphic Era Hill University, Dehradun. The prototype is
demonstrated on flood and landslide scenarios in Uttarakhand.

> **Status: scaffolded, no features.** The packages build, lint, type-check and deploy, and
> `/api/health` answers. No PRD feature (F1–F14) is implemented yet — there is no
> database schema, no auth and no scoring. See [`MEMORY.md`](MEMORY.md) for exactly where things
> stand and [`PLAN.md`](PLAN.md) for what lands when.

## The loop

```
citizen submits request
  → request enters the prioritized queue
  → system ranks volunteers and teams, with an explanation for each
  → on-site commander selects / modifies / rejects
  → office commander approves or sends back
  → volunteer accepts / declines / completes
  → every decision is logged
```

## Stack

| | |
|---|---|
| Frontend | React 19, Vite, Tailwind v4, shadcn/ui, TanStack Query, Leaflet — installable as a PWA |
| Backend | Node.js, Express 5, strict TypeScript, zod |
| Database | PostgreSQL via Drizzle ORM (no PostGIS; distance is haversine) |
| Auth | Server-side sessions in PostgreSQL, httpOnly cookie, bcrypt |
| Live updates | Client polling every ~5 s |
| Deployment | One Docker image (API + built SPA, same origin) on Render, with Neon PostgreSQL |

Ranking is deterministic formulas, not ML — that is what makes every recommendation explainable.

## Running it

**Whole stack** (needs Docker):

```bash
cp .env.example .env && docker compose up --build
```

Serves `http://localhost:3000`, building the same image Render deploys. Browsers treat `localhost`
as a secure context, so geolocation and PWA install work without TLS. `docker compose down -v`
stops it and drops the database volume.

**Just the API:**

```bash
cd api && npm install && npm run dev
```

To point the API at the real Neon database instead of the local container, run
`neon link` once (it writes `.env.local`, which is git-ignored), then:

```bash
cd api && node --env-file=../.env.local --import tsx src/index.ts
```

**Just the SPA** (proxies `/api` to port 3000):

```bash
cd web && npm install && npm run dev
```

## Checks

Run in both `web/` and `api/`. All four must pass before a change is done.

```bash
npm run lint && npm run typecheck && npm test && npm run format:check
```

## Layout

```
web/                      React SPA — all five roles
api/
  src/routes/             HTTP: auth guard, zod validation, response shaping
  src/services/           business rules and transactions
  src/scoring/            pure ranking functions — no I/O, no clock, no randomness
  src/db/                 Drizzle schema, queries, migrations
Dockerfile                builds web/ and api/ into the one deployed image
docker-compose.yml        db + app, building that same image
render.yaml               Render service definition
neon.ts                   Neon branch policy, applied with `neon deploy`
.github/workflows/ci.yml  lint, type-check and tests on every pull request
disasterIND.csv           EM-DAT India disaster records, reference data for scenarios
```

## Documentation

Start with [`AGENTS.md`](AGENTS.md) — it is the entry point for both people and coding agents.

| File | What it covers |
|---|---|
| [`PRD.md`](PRD.md) | Scope, roles, features F1–F14, user flows, acceptance criteria AC1–AC24 |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Stack, layers, data model, boundaries, decision status |
| [`DESIGN.md`](DESIGN.md) | Design system — read before any UI work |
| [`RULES.md`](RULES.md) | Coding rules and forbidden practices |
| [`TESTING.md`](TESTING.md) | Testing strategy and the Definition of Done |
| [`PLAN.md`](PLAN.md) | Seven-phase delivery plan and department milestones |
| [`DECISIONS.md`](DECISIONS.md) | Decision log, append-only |
| [`MEMORY.md`](MEMORY.md) | Current state, open problems, next steps |

## Non-negotiables

These hold everywhere in the codebase, and the tests exist to prove they still do:

- No offer or deployment without a logged on-site selection **and** a logged office approval.
- The audit log is append-only at the database level — the app's role has `INSERT` and `SELECT` only.
- Citizen phone numbers and volunteer locations reach commanders only. Never volunteers, never the
  Admin, never audit snapshots or CSV exports.
- Every recommendation's per-factor contributions sum to its displayed score.

## Team

Divyansh Garg · Ayush Rawat · Suryanshu Bisht — mentored by Mr. Rahul Chauhan.

## License

[MIT](LICENSE)
