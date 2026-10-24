import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';

// Test-only. Empties every table between test files (TESTING.md -> Test isolation).
// ponytail: runs as the app role; switch to the separate truncate role (D-038) once the
// audit table exists and the app role loses DELETE on it.
export async function truncateAll(): Promise<void> {
  await db.execute(sql`truncate table sessions, users cascade`);
}
