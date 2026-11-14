import { db } from '../db/client.js';
import { scoringWeights } from '../db/schema.js';

/** The single settings row (D-056): weights, Freshness window, latest location request. */
export async function getSettings() {
  const [row] = await db.select().from(scoringWeights);
  if (!row) throw new Error('scoring_weights row is missing; migration 0002 inserts it.');
  return row;
}
