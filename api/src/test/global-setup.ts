import { closeDb } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';
import { env } from '../env.js';
import { assertTestDatabase } from './guard.js';

// Migrate the test database from empty once per run (TESTING.md -> Database Testing).
export default async function setup(): Promise<void> {
  assertTestDatabase(env.databaseUrl);
  await runMigrations();
  await closeDb();
}
