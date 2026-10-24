import { closeDb } from '../db/client.js';
import { runMigrations } from '../db/migrate.js';

// Migrate the test database from empty once per run (TESTING.md -> Database Testing).
export default async function setup(): Promise<void> {
  await runMigrations();
  await closeDb();
}
