import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env.js';
import * as schema from './schema.js';

const sql = postgres(env.databaseUrl, { connect_timeout: 5 });

export const db = drizzle(sql, { schema });

/** True when the database answers. Used by /api/health only. */
export async function pingDb(): Promise<boolean> {
  try {
    await sql`select 1`;
    return true;
  } catch {
    return false;
  }
}
