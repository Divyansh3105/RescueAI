import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Drizzle schema (ARCHITECTURE.md -> Database Architecture). Raw-SQL pieces drizzle-kit
// cannot express (the settings row insert, the audit triggers and grants) live in the
// migration files themselves (RULES.md -> Database Rules).

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
    // The automatic severity (PRD F5); a commander override goes in severityOverride.
    severity: integer('severity').notNull(),
    severityOverride: integer('severity_override'),
    status: requestStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // PRD F14. The later evaluation times are the first selection, approval, acceptance and
    // completion, read from selections and assignments; this one has nowhere else to live.
    firstRecommendedAt: timestamp('first_recommended_at', { withTimezone: true }),
  },
  (t) => [
    check('rescue_requests_lat_range', sql`${t.lat} between -90 and 90`),
    check('rescue_requests_lon_range', sql`${t.lon} between -180 and 180`),
    check('rescue_requests_severity_range', sql`${t.severity} between 1 and 5`),
    check(
      'rescue_requests_override_range',
      sql`${t.severityOverride} is null or ${t.severityOverride} between 1 and 5`,
    ),
    check(
      'rescue_requests_counts_nonneg',
      sql`coalesce(${t.affected}, 0) >= 0 and coalesce(${t.trapped}, 0) >= 0 and coalesce(${t.injured}, 0) >= 0`,
    ),
    index('rescue_requests_status_idx').on(t.status),
  ],
);

// PRD F2 fixed skill list; team capabilities use the same list (F4).
export const skill = pgEnum('skill', [
  'first_aid',
  'swimming',
  'boat_handling',
  'heavy_lifting',
  'driving',
  'local_language',
]);
export const skillStatus = pgEnum('skill_status', ['unverified', 'verified', 'rejected']);

// PRD F2. One row per volunteer user. Counters feed Reliability (F7) and may be set by a
// scenario (F14), so they are stored rather than derived from assignments.
export const volunteerProfiles = pgTable(
  'volunteer_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id),
    available: boolean('available').notNull().default(false),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    locationAt: timestamp('location_at', { withTimezone: true }),
    offeredCount: integer('offered_count').notNull().default(0),
    acceptedCount: integer('accepted_count').notNull().default(0),
    declinedCount: integer('declined_count').notNull().default(0),
    withdrawnCount: integer('withdrawn_count').notNull().default(0),
    completedCount: integer('completed_count').notNull().default(0),
  },
  (t) => [
    check(
      'volunteer_profiles_location_whole',
      sql`(${t.lat} is null) = (${t.lon} is null) and (${t.lat} is null) = (${t.locationAt} is null)`,
    ),
    check('volunteer_profiles_lat_range', sql`${t.lat} between -90 and 90`),
    check('volunteer_profiles_lon_range', sql`${t.lon} between -180 and 180`),
    // F2: setting Available requires sharing location.
    check(
      'volunteer_profiles_available_has_location',
      sql`not ${t.available} or ${t.lat} is not null`,
    ),
    check(
      'volunteer_profiles_counts_nonneg',
      sql`least(${t.offeredCount}, ${t.acceptedCount}, ${t.declinedCount}, ${t.withdrawnCount}, ${t.completedCount}) >= 0`,
    ),
  ],
);

// PRD F2/F3. Only verified skills count in matching.
export const volunteerSkills = pgTable(
  'volunteer_skills',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => volunteerProfiles.userId),
    skill: skill('skill').notNull(),
    status: skillStatus('status').notNull().default('unverified'),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skill] }),
    check(
      'volunteer_skills_verifier_matches_status',
      sql`(${t.status} = 'unverified') = (${t.verifiedBy} is null) and (${t.verifiedBy} is null) = (${t.verifiedAt} is null)`,
    ),
  ],
);

export const teamForce = pgEnum('team_force', ['sdrf', 'ndrf']);
export const teamStatus = pgEnum('team_status', ['available', 'deployed', 'unavailable']);

// PRD F4. Teams have no login.
export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    force: teamForce('force').notNull(),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    status: teamStatus('status').notNull().default('available'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('teams_lat_range', sql`${t.lat} between -90 and 90`),
    check('teams_lon_range', sql`${t.lon} between -180 and 180`),
  ],
);

export const teamCapabilities = pgTable(
  'team_capabilities',
  {
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    skill: skill('skill').notNull(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.skill] })],
);

export const selectionStatus = pgEnum('selection_status', [
  'awaiting_approval',
  'approved',
  'sent_back',
]);

// PRD F9 levels 1 and 2. The explanation snapshot lives in the audit entry only (D-042).
export const selections = pgTable(
  'selections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => rescueRequests.id),
    requiredSkills: skill('required_skills').array().notNull(),
    status: selectionStatus('status').notNull().default('awaiting_approval'),
    selectedBy: uuid('selected_by')
      .notNull()
      .references(() => users.id),
    selectedAt: timestamp('selected_at', { withTimezone: true }).notNull().defaultNow(),
    // The office commander who approved or sent it back, and the send-back reason.
    decidedBy: uuid('decided_by').references(() => users.id),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    reason: text('reason'),
  },
  (t) => [
    // Target of the assignments' (selection_id, 'approved') foreign key.
    unique('selections_id_status_unique').on(t.id, t.status),
    check(
      'selections_decider_matches_status',
      sql`(${t.status} = 'awaiting_approval') = (${t.decidedBy} is null) and (${t.decidedBy} is null) = (${t.decidedAt} is null)`,
    ),
    // AC22: the selecting and approving accounts must differ.
    check('selections_two_people', sql`${t.decidedBy} <> ${t.selectedBy}`),
    index('selections_request_idx').on(t.requestId),
  ],
);

// The responders in one selection: exactly one of volunteer or team per row.
export const selectionResponders = pgTable(
  'selection_responders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    selectionId: uuid('selection_id')
      .notNull()
      .references(() => selections.id),
    volunteerId: uuid('volunteer_id').references(() => volunteerProfiles.userId),
    teamId: uuid('team_id').references(() => teams.id),
  },
  (t) => [
    check('selection_responders_one_kind', sql`num_nonnulls(${t.volunteerId}, ${t.teamId}) = 1`),
    unique('selection_responders_volunteer_unique').on(t.selectionId, t.volunteerId),
    unique('selection_responders_team_unique').on(t.selectionId, t.teamId),
  ],
);

// PRD F10. Volunteers go offered -> accepted / declined / withdrawn, accepted -> completed;
// teams go deployed -> completed.
export const assignmentStatus = pgEnum('assignment_status', [
  'offered',
  'accepted',
  'declined',
  'withdrawn',
  'deployed',
  'completed',
]);

export const assignments = pgTable(
  'assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => rescueRequests.id),
    selectionId: uuid('selection_id').notNull(),
    // Always 'approved'. With the foreign key below, the database itself refuses an
    // assignment whose selection is not approved (AC11).
    selectionStatus: selectionStatus('selection_status').notNull().default('approved'),
    volunteerId: uuid('volunteer_id').references(() => volunteerProfiles.userId),
    teamId: uuid('team_id').references(() => teams.id),
    status: assignmentStatus('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      name: 'assignments_approved_selection_fk',
      columns: [t.selectionId, t.selectionStatus],
      foreignColumns: [selections.id, selections.status],
    }),
    check('assignments_selection_approved', sql`${t.selectionStatus} = 'approved'`),
    check('assignments_one_kind', sql`num_nonnulls(${t.volunteerId}, ${t.teamId}) = 1`),
    check(
      'assignments_status_fits_kind',
      sql`case when ${t.teamId} is not null then ${t.status} in ('deployed', 'completed') else ${t.status} <> 'deployed' end`,
    ),
    // PRD F10: a volunteer or team holds at most one active assignment.
    uniqueIndex('assignments_one_active_volunteer')
      .on(t.volunteerId)
      .where(sql`${t.status} in ('offered', 'accepted')`),
    uniqueIndex('assignments_one_active_team')
      .on(t.teamId)
      .where(sql`${t.status} = 'deployed'`),
    index('assignments_request_idx').on(t.requestId),
  ],
);

// The single settings row (id = 1): weights (F6, F7), the Freshness window (D-054) and the
// latest location request (F2, D-042). Weight sums are checked with zod, not here (D-042).
export const scoringWeights = pgTable(
  'scoring_weights',
  {
    id: integer('id').primaryKey().default(1),
    w1: doublePrecision('w1').notNull().default(0.25),
    w2: doublePrecision('w2').notNull().default(0.25),
    w3: doublePrecision('w3').notNull().default(0.25),
    w4: doublePrecision('w4').notNull().default(0.25),
    alpha: doublePrecision('alpha')
      .notNull()
      .default(1 / 3),
    beta: doublePrecision('beta')
      .notNull()
      .default(1 / 3),
    gamma: doublePrecision('gamma')
      .notNull()
      .default(1 / 3),
    freshnessMinutes: integer('freshness_minutes').notNull().default(120),
    locationRequestedAt: timestamp('location_requested_at', { withTimezone: true }),
    locationRequestedBy: uuid('location_requested_by').references(() => users.id),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('scoring_weights_single_row', sql`${t.id} = 1`),
    check(
      'scoring_weights_in_range',
      sql`least(${t.w1}, ${t.w2}, ${t.w3}, ${t.w4}, ${t.alpha}, ${t.beta}, ${t.gamma}) >= 0 and greatest(${t.w1}, ${t.w2}, ${t.w3}, ${t.w4}, ${t.alpha}, ${t.beta}, ${t.gamma}) <= 1`,
    ),
    check('scoring_weights_freshness_positive', sql`${t.freshnessMinutes} > 0`),
  ],
);

// PRD F13 events, plus the Admin password reset (AC25).
export const auditAction = pgEnum('audit_action', [
  'onsite_select',
  'onsite_modify',
  'onsite_reject',
  'office_approve',
  'office_send_back',
  'severity_override',
  'skill_verify',
  'location_request',
  'offer_accept',
  'offer_decline',
  'offer_withdraw',
  'status_change',
  'password_reset',
]);

// Append-only (AC17): the migration adds triggers that reject UPDATE, DELETE and TRUNCATE
// and revokes those rights from the app role. The snapshot must never hold citizen phone
// numbers or volunteer coordinates (F13, AC20).
export const auditEntries = pgTable(
  'audit_entries',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    action: auditAction('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    snapshot: jsonb('snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_entries_created_idx').on(t.createdAt)],
);
