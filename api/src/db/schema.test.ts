import { eq, sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './client.js';
import {
  assignments,
  auditEntries,
  rescueRequests,
  scoringWeights,
  selections,
  users,
  volunteerProfiles,
} from './schema.js';
import { truncateAll } from '../test/reset.js';

const user = { name: 'Test', phone: '9000000001', passwordHash: 'x', role: 'volunteer' as const };

/** The PostgreSQL error message behind a rejected query (drizzle wraps it in `cause`). */
async function failure(query: Promise<unknown>): Promise<string> {
  try {
    await query;
  } catch (e) {
    const cause = (e as { cause?: unknown }).cause ?? e;
    return (cause as Error).message;
  }
  throw new Error('expected the query to fail');
}

async function addUser(phone: string, role: (typeof users.$inferInsert)['role']) {
  const [row] = await db
    .insert(users)
    .values({ name: role, phone, passwordHash: 'x', role })
    .returning({ id: users.id });
  return row!.id;
}

/** A request, a volunteer, an on-site and an office commander, and an awaiting selection. */
async function fixture() {
  const volunteer = await addUser('9000000011', 'volunteer');
  await db.insert(volunteerProfiles).values({ userId: volunteer });
  const onsite = await addUser('9000000012', 'onsite_commander');
  const office = await addUser('9000000013', 'office_commander');
  const [request] = await db
    .insert(rescueRequests)
    .values({ hazard: 'flood', lat: 30.3, lon: 78, phone: '9876543210', severity: 3 })
    .returning({ id: rescueRequests.id });
  const newSelection = async () => {
    const [s] = await db
      .insert(selections)
      .values({ requestId: request!.id, requiredSkills: ['first_aid'], selectedBy: onsite })
      .returning({ id: selections.id });
    return s!.id;
  };
  const approve = (id: string) =>
    db
      .update(selections)
      .set({ status: 'approved', decidedBy: office, decidedAt: new Date() })
      .where(eq(selections.id, id));
  return { volunteer, onsite, office, requestId: request!.id, newSelection, approve };
}

describe('users table', () => {
  beforeEach(truncateAll);

  it('rejects a second user with the same phone', async () => {
    await db.insert(users).values(user);
    await expect(db.insert(users).values(user)).rejects.toThrow();
  });
});

describe('audit_entries', () => {
  beforeEach(truncateAll);

  it('AC17: UPDATE, DELETE and TRUNCATE fail as the app role', async () => {
    const actorId = await addUser('9000000021', 'admin');
    await db
      .insert(auditEntries)
      .values({ actorId, action: 'password_reset', targetType: 'user', targetId: actorId });

    expect(await failure(db.update(auditEntries).set({ targetId: 'changed' }))).toMatch(
      /append-only/,
    );
    expect(await failure(db.delete(auditEntries))).toMatch(/append-only/);
    expect(await failure(db.execute(sql`truncate table audit_entries`))).toMatch(/append-only/);
    expect(await db.select().from(auditEntries)).toHaveLength(1);
  });
});

describe('selections and assignments', () => {
  beforeEach(truncateAll);

  it('AC22: the approver cannot be the account that selected', async () => {
    const f = await fixture();
    const id = await f.newSelection();
    const selfApprove = db
      .update(selections)
      .set({ status: 'approved', decidedBy: f.onsite, decidedAt: new Date() })
      .where(eq(selections.id, id));
    expect(await failure(selfApprove)).toMatch(/selections_two_people/);
  });

  it('AC11: no assignment for a selection that is not approved', async () => {
    const f = await fixture();
    const selectionId = await f.newSelection();
    const offer = db.insert(assignments).values({
      requestId: f.requestId,
      selectionId,
      volunteerId: f.volunteer,
      status: 'offered',
    });
    expect(await failure(offer)).toMatch(/assignments_approved_selection_fk/);
  });

  it('rejects a second active assignment for the same volunteer, not a finished one', async () => {
    const f = await fixture();
    const first = await f.newSelection();
    const second = await f.newSelection();
    await f.approve(first);
    await f.approve(second);
    const offer = (selectionId: string) =>
      db
        .insert(assignments)
        .values({
          requestId: f.requestId,
          selectionId,
          volunteerId: f.volunteer,
          status: 'offered',
        })
        .returning({ id: assignments.id });

    const [a] = await offer(first);
    expect(await failure(offer(second))).toMatch(/assignments_one_active_volunteer/);

    await db.update(assignments).set({ status: 'declined' }).where(eq(assignments.id, a!.id));
    await expect(offer(second)).resolves.toHaveLength(1);
  });

  it('keeps an approved selection approved once it has assignments', async () => {
    const f = await fixture();
    const id = await f.newSelection();
    await f.approve(id);
    await db.insert(assignments).values({
      requestId: f.requestId,
      selectionId: id,
      volunteerId: f.volunteer,
      status: 'offered',
    });
    const reopen = db.update(selections).set({ status: 'sent_back' }).where(eq(selections.id, id));
    expect(await failure(reopen)).toMatch(/assignments_approved_selection_fk/);
  });
});

describe('volunteer_profiles', () => {
  beforeEach(truncateAll);

  it('cannot be Available without a location (F2)', async () => {
    const userId = await addUser('9000000031', 'volunteer');
    const noLocation = db.insert(volunteerProfiles).values({ userId, available: true });
    expect(await failure(noLocation)).toMatch(/volunteer_profiles_available_has_location/);
  });
});

describe('scoring_weights', () => {
  beforeEach(truncateAll);

  it('holds exactly one row with the PRD initial weights', async () => {
    const rows = await db.select().from(scoringWeights);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ w1: 0.25, w4: 0.25, freshnessMinutes: 120 });
    expect(rows[0]!.alpha).toBeCloseTo(1 / 3);
    expect(await failure(db.insert(scoringWeights).values({ id: 2 }))).toMatch(
      /scoring_weights_single_row/,
    );
  });
});
