import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Drizzle schema (ARCHITECTURE.md -> Database Architecture). Still to come in later
// phases: VOLUNTEER_PROFILE, VOLUNTEER_SKILL, TEAM, TEAM_CAPABILITY, RESCUE_REQUEST,
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
