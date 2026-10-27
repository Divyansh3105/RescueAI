import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// Drizzle schema (ARCHITECTURE.md -> Database Architecture). Still to come in later
// phases: VOLUNTEER_PROFILE, VOLUNTEER_SKILL, TEAM, TEAM_CAPABILITY,
// SELECTION, ASSIGNMENT, SCORING_WEIGHTS, AUDIT_ENTRY.

export const userRole = pgEnum('user_role', [
  'volunteer',
  'onsite_commander',
  'office_commander',
  'admin',
]);
export type UserRole = (typeof userRole.enumValues)[number];

// Citizens have no user row.
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRole('role').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// The cookie holds a random token; only its SHA-256 is stored here (D-052).
export const sessions = pgTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const hazardType = pgEnum('hazard_type', ['flood', 'landslide']);
// PRD F10: Pending -> In Progress -> Resolved or Cancelled.
export const requestStatus = pgEnum('request_status', [
  'pending',
  'in_progress',
  'resolved',
  'cancelled',
]);

// PRD F1. Citizens have no user row. `seq` is the number in the reference ID (RQ-1000, D-037).
export const rescueRequests = pgTable(
  'rescue_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    seq: integer('seq').notNull().unique().generatedAlwaysAsIdentity({ startWith: 1000 }),
    hazard: hazardType('hazard').notNull(),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    phone: text('phone').notNull(),
    contactName: text('contact_name'),
    affected: integer('affected'),
    trapped: integer('trapped'),
    injured: integer('injured'),
    flagChildren: boolean('flag_children').notNull().default(false),
    flagElderly: boolean('flag_elderly').notNull().default(false),
    flagInjured: boolean('flag_injured').notNull().default(false),
    flagDisability: boolean('flag_disability').notNull().default(false),
    description: text('description'),
    // The automatic severity (PRD F5). The commander override gets its own column later.
    severity: integer('severity').notNull(),
    status: requestStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('rescue_requests_lat_range', sql`${t.lat} between -90 and 90`),
    check('rescue_requests_lon_range', sql`${t.lon} between -180 and 180`),
    check('rescue_requests_severity_range', sql`${t.severity} between 1 and 5`),
    check(
      'rescue_requests_counts_nonneg',
      sql`coalesce(${t.affected}, 0) >= 0 and coalesce(${t.trapped}, 0) >= 0 and coalesce(${t.injured}, 0) >= 0`,
    ),
    index('rescue_requests_status_idx').on(t.status),
  ],
);
