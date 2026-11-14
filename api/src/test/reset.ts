import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';

// Test-only. Empties every table between test files (TESTING.md -> Test isolation).
// The audit table's append-only triggers also block TRUNCATE, so this switches triggers off
// for its own transaction with session_replication_role, which needs a superuser - the test
// container's user is one, the deployed app role is not (D-056). The CASCADE also empties the
// settings row, so it is put back.
export async function truncateAll(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`set local session_replication_role = replica`);
    await tx.execute(sql`truncate table rescue_requests, sessions, users, teams cascade`);
    await tx.execute(sql`insert into scoring_weights (id) values (1)`);
  });
}
