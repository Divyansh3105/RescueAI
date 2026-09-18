# Testing Strategy

> **State (2026-09-11):** No tests, test configuration, `package.json` or CI exist yet, because the repository contains only documentation. This file records the **decided** testing strategy (DECISIONS.md D-021, D-024). Anything marked **Not established** must be decided and written here before it is relied on. Update this file whenever the testing strategy or tooling changes.

This is the canonical testing document. `RULES.md` and `AGENTS.md` point here.

## Testing Philosophy

- **Test the rules that make RescueAI safe:**
  - no dispatch without a logged on-site selection and a logged office approval (AC11, AC22)
  - citizen phone numbers and volunteer locations only in commander responses (AC14)
  - an audit log that can't be changed (AC17)
  - role-based access (AC18)
  
  These are proven against the **real database**, because they depend on transactions, constraints and database grants.
- **Test ranking as pure math.** The scoring code has no I/O (DECISIONS.md D-019), so its acceptance criteria are checked with plain, fast unit tests.
- **Trace every test to an acceptance criterion.** A feature is done when the PRD criteria it covers are verified (see Definition of Done).

## Test Stack

| Purpose | Tool | Status |
|---|---|---|
| Test runner (web and api) | Vitest | Decided (D-021) |
| Database for integration tests | PostgreSQL in Docker | Decided (D-024) |
| DB schema in tests | drizzle-kit migrations | Decided (D-014) |
| Lint / format | ESLint + Prettier | Decided (D-021) |
| Type-check | TypeScript `strict` | Decided (D-022) |
| HTTP client for API tests | supertest | Decided (D-038) |
| React component-test library | None in the MVP | Decided (D-038) |
| Coverage tool / threshold | None | Decided (D-038) |
| CI | GitHub Actions: lint, type-check and tests on every PR | Decided (D-039) |
| E2E browser testing | None in MVP | Decided (D-024) |

**Commands:** Not established. There is no `package.json` yet. Add the real commands here and in `AGENTS.md` once they exist and have been run. Don't guess script names.

## Unit Testing

**Scope:** `api/src/scoring/`, which holds the severity rule, P(r), S(v,r), contributions and reliability.

- **Required (D-024):** AC3, AC5, AC8, AC9.
- Scoring functions are pure, so tests pass plain objects in and check the result.
  - No database, no server, no mocks.
  - Pass time in as `now`. Never let a test depend on the real clock.
- Prefer small hand-built cases that pin down one rule each. Examples:
  - two requests identical except their age (AC5)
  - two volunteers identical except distance, location age or reliability (AC8)
  - contributions adding up to the score within rounding (AC9)

## Integration Testing

**Scope:** API routes → services → a real PostgreSQL database, with the schema created by the project's migrations.

- **Required (D-024):** AC11, AC14, AC17, AC18, plus AC22 (added with two-level approval, D-030).
- The test database is PostgreSQL in Docker, migrated from an empty database with drizzle-kit, never created by hand.
- Integration tests are the only place transactions, constraints and grants are exercised. Don't substitute unit tests for them.

## End-to-End Testing

**None in the MVP** (D-024). This is a known gap: UI flows have no automated coverage.

UI acceptance criteria are verified **manually** by running the app, and the result is noted in the PR:
- **AC2:** the request appears in the queue without a reload.
- **AC19:** the map shows requests, volunteers and teams.
- **AC21:** volunteer screens work at 375px, including location sharing.
- **AC23:** the location request banner appears without a reload.
- **AC24:** every citizen and volunteer screen reads correctly in Hindi on a real Android phone.
- The accessibility rules in `DESIGN.md` → Accessibility.

## API Testing

API tests are the integration tests above, run at the HTTP boundary.

- **Log in as a real user.** Tests authenticate through the actual login route and session cookie. Don't forge session state.
- **AC18, access:** for each non-public route, check that at least one role not on its allowed list gets rejected, and that the public request route works without a session.
- **AC14, personal data:** assert on the actual response body. The citizen phone number and volunteer coordinates must be absent from every volunteer and Admin response, before and after acceptance, and from CSV exports.
- **AC11, approval:** check that no assignment row exists without an approved selection that has both an on-site selection audit entry and an office approval audit entry. Also check that a failed approval leaves neither an assignment nor an audit row, because they roll back together.
- **AC22, two levels:** an office commander can't approve without a selection awaiting approval, an on-site commander can't approve at all, and a send-back creates no assignment.

## Database Testing

- **Apply all migrations to an empty database** before the integration suite. This also tests the migrations themselves.
- **AC17 must run as the application's database role, not a superuser.** Assert that UPDATE and DELETE on the audit table fail.
- **Constraints get tests too.** For example, try to create a second active assignment for the same responder; this is PRD F10, confirmed 2026-09-15.
- **Test isolation (D-038):** migrations run once against the test database, then a separate privileged role — not the app role — truncates the tables, including the audit table, between test files. **Never** give the app role delete rights to make cleanup easier.

## Mocking Strategy

- **Never mock PostgreSQL** in integration tests (D-024).
- **Never mock `scoring/`** in service or API tests. Use the real functions.
- **Control time by passing `now`** to scoring, not by mocking the system clock.
- The MVP API calls no external services, so there is nothing external to mock. The frontend's OSM map tiles are not part of automated tests.
- Frontend mocking: not needed. The MVP has no component tests (D-038), so citizen and volunteer screens are checked by hand.

## Test Data

- **Synthetic data only.** Never use real people's phone numbers or locations (PRD Technical Constraints, RULES.md).
- **Each test creates the data it needs**, such as users, volunteers, teams and requests. Don't depend on the order tests run in.
- The scenario dataset loaded through Admin (PRD F14) is for demos and evaluation. Tests must not depend on it.

## Test Naming Conventions

- **Put the criterion ID first:** `it("AC9: contributions sum to the displayed score", …)`. A test that covers no criterion describes the behavior it checks instead.
- **Test file names** use kebab-case (RULES.md) and end in `.test.ts`. Test files sit next to the code they cover (D-038).

## Coverage Requirements

- **The required coverage is the list of criteria**, not a percentage:
  - Unit: AC3, AC5, AC8, AC9.
  - Integration: AC11, AC14, AC17, AC18, AC22.
- **There is no numeric coverage threshold** (D-038). The criteria above are the bar; don't add a percentage target.
- **Allocation for the remaining criteria** (accepted, D-038). Every one must still be verified before its feature is done (AGENTS.md):

| Criteria | Verification |
|---|---|
| AC1, AC4, AC7, AC10, AC12, AC13, AC16, AC20 | Integration |
| AC6, AC15 | Unit (formula term) and integration (eligibility / counter update) |
| AC2 | Integration (reference ID, queue visibility) and manual (live update) |
| AC19, AC21 | Manual |
| AC23 | Integration (banner flag in the volunteer response) and manual (appears without reload) |
| AC24 | Unit (the `en` and `hi` dictionaries have identical keys) and manual (every screen in Hindi) |

## Required Checks

Before a change is complete, run all of these and report the real output:
1. **Lint:** ESLint, in `web/` and `api/`.
2. **Type-check:** TypeScript strict, in `web/` and `api/`.
3. **Tests:** the full Vitest suite, including integration tests against Docker PostgreSQL.
   - A skipped or focused test (`.skip`, `.only`) doesn't count as passing.
4. **Manual checks:** if UI changed, the manual checks listed under End-to-End Testing.

The commands for 1–3 are **Not established** yet (see Test Stack).

## CI Testing

**GitHub Actions** (D-039). Every pull request runs lint, type-check and the full Vitest suite, including the integration tests against PostgreSQL in Docker. The workflow does not exist yet: until it does, the checks run locally and the PR reviewer (RULES.md → Git Rules) confirms they passed. Record the workflow file and its commands here once they exist and have run.

## Definition of Done

A change is done when:
- It has tests for the PRD criteria it touches, named with the criterion ID. Any of the nine required criteria it affects are still covered and passing.
- All Required Checks pass locally, with the real output reported, and no tests are skipped or focused.
- UI changes have been manually verified against `DESIGN.md` and the relevant criteria, noted in the PR.
- No test mocks the database or scoring, and none uses real personal data.
- This file is updated if the change adds or changes testing tools, commands or strategy.

The rest of the completion checklist is in `AGENTS.md` → Verification Checklist.
