import { inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { rescueRequests } from '../db/schema.js';
import { band, byPriority, priority, severity, type Hazard } from '../scoring/request.js';

export const refOf = (seq: number) => `RQ-${String(seq)}`;

export const FLAGS = ['children', 'elderly', 'injured', 'disability'] as const;
export type Flag = (typeof FLAGS)[number];

export interface NewRequest {
  lat: number;
  lon: number;
  hazard: Hazard;
  phone: string;
  contactName?: string;
  affected?: number;
  trapped?: number;
  injured?: number;
  flags: Flag[];
  description?: string;
}

/** PRD F1: stores a citizen request with its automatic severity (F5). Returns the reference ID. */
export async function createRequest(input: NewRequest): Promise<string> {
  const [row] = await db
    .insert(rescueRequests)
    .values({
      lat: input.lat,
      lon: input.lon,
      hazard: input.hazard,
      phone: input.phone,
      contactName: input.contactName,
      affected: input.affected,
      trapped: input.trapped,
      injured: input.injured,
      flagChildren: input.flags.includes('children'),
      flagElderly: input.flags.includes('elderly'),
      flagInjured: input.flags.includes('injured'),
      flagDisability: input.flags.includes('disability'),
      description: input.description,
      severity: severity({
        hazard: input.hazard,
        trapped: input.trapped ?? null,
        injured: input.injured ?? null,
      }),
    })
    .returning({ seq: rescueRequests.seq });
  return refOf(row!.seq);
}

/**
 * PRD F6: Pending and In-Progress requests, highest P(r) first. Includes the citizen's phone
 * number, so only commander routes may call this (AC14).
 */
export async function listQueue(now: Date) {
  const rows = await db
    .select()
    .from(rescueRequests)
    .where(inArray(rescueRequests.status, ['pending', 'in_progress']));
  return rows
    .map((r) => {
      const on = {
        children: r.flagChildren,
        elderly: r.flagElderly,
        injured: r.flagInjured,
        disability: r.flagDisability,
      };
      const flags = FLAGS.filter((f) => on[f]);
      const score = priority(
        { severity: r.severity, flagCount: flags.length, createdAt: r.createdAt },
        now,
      );
      return {
        ref: refOf(r.seq),
        hazard: r.hazard,
        lat: r.lat,
        lon: r.lon,
        affected: r.affected,
        trapped: r.trapped,
        injured: r.injured,
        flags,
        description: r.description,
        contactName: r.contactName,
        phone: r.phone,
        status: r.status,
        severity: r.severity,
        createdAt: r.createdAt,
        score,
        band: band(score.total),
      };
    })
    .sort(byPriority);
}
