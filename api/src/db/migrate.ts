import path from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client.js';

/** Applies pending drizzle-kit migrations. Runs at API start-up so deploys need no shell (D-053). */
export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: path.resolve(import.meta.dirname, '../../drizzle') });
}
