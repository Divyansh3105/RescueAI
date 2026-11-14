CREATE TYPE "public"."assignment_status" AS ENUM('offered', 'accepted', 'declined', 'withdrawn', 'deployed', 'completed');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('onsite_select', 'onsite_modify', 'onsite_reject', 'office_approve', 'office_send_back', 'severity_override', 'skill_verify', 'location_request', 'offer_accept', 'offer_decline', 'offer_withdraw', 'status_change', 'password_reset');--> statement-breakpoint
CREATE TYPE "public"."selection_status" AS ENUM('awaiting_approval', 'approved', 'sent_back');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('first_aid', 'swimming', 'boat_handling', 'heavy_lifting', 'driving', 'local_language');--> statement-breakpoint
CREATE TYPE "public"."skill_status" AS ENUM('unverified', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."team_force" AS ENUM('sdrf', 'ndrf');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('available', 'deployed', 'unavailable');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"selection_id" uuid NOT NULL,
	"selection_status" "selection_status" DEFAULT 'approved' NOT NULL,
	"volunteer_id" uuid,
	"team_id" uuid,
	"status" "assignment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "assignments_selection_approved" CHECK ("assignments"."selection_status" = 'approved'),
	CONSTRAINT "assignments_one_kind" CHECK (num_nonnulls("assignments"."volunteer_id", "assignments"."team_id") = 1),
	CONSTRAINT "assignments_status_fits_kind" CHECK (case when "assignments"."team_id" is not null then "assignments"."status" in ('deployed', 'completed') else "assignments"."status" <> 'deployed' end)
);
--> statement-breakpoint
CREATE TABLE "audit_entries" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"actor_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_weights" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"w1" double precision DEFAULT 0.25 NOT NULL,
	"w2" double precision DEFAULT 0.25 NOT NULL,
	"w3" double precision DEFAULT 0.25 NOT NULL,
	"w4" double precision DEFAULT 0.25 NOT NULL,
	"alpha" double precision DEFAULT 0.3333333333333333 NOT NULL,
	"beta" double precision DEFAULT 0.3333333333333333 NOT NULL,
	"gamma" double precision DEFAULT 0.3333333333333333 NOT NULL,
	"freshness_minutes" integer DEFAULT 120 NOT NULL,
	"location_requested_at" timestamp with time zone,
	"location_requested_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scoring_weights_single_row" CHECK ("scoring_weights"."id" = 1),
	CONSTRAINT "scoring_weights_in_range" CHECK (least("scoring_weights"."w1", "scoring_weights"."w2", "scoring_weights"."w3", "scoring_weights"."w4", "scoring_weights"."alpha", "scoring_weights"."beta", "scoring_weights"."gamma") >= 0 and greatest("scoring_weights"."w1", "scoring_weights"."w2", "scoring_weights"."w3", "scoring_weights"."w4", "scoring_weights"."alpha", "scoring_weights"."beta", "scoring_weights"."gamma") <= 1),
	CONSTRAINT "scoring_weights_freshness_positive" CHECK ("scoring_weights"."freshness_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "selection_responders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"selection_id" uuid NOT NULL,
	"volunteer_id" uuid,
	"team_id" uuid,
	CONSTRAINT "selection_responders_volunteer_unique" UNIQUE("selection_id","volunteer_id"),
	CONSTRAINT "selection_responders_team_unique" UNIQUE("selection_id","team_id"),
	CONSTRAINT "selection_responders_one_kind" CHECK (num_nonnulls("selection_responders"."volunteer_id", "selection_responders"."team_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"required_skills" "skill"[] NOT NULL,
	"status" "selection_status" DEFAULT 'awaiting_approval' NOT NULL,
	"selected_by" uuid NOT NULL,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"reason" text,
	CONSTRAINT "selections_id_status_unique" UNIQUE("id","status"),
	CONSTRAINT "selections_decider_matches_status" CHECK (("selections"."status" = 'awaiting_approval') = ("selections"."decided_by" is null) and ("selections"."decided_by" is null) = ("selections"."decided_at" is null)),
	CONSTRAINT "selections_two_people" CHECK ("selections"."decided_by" <> "selections"."selected_by")
);
--> statement-breakpoint
CREATE TABLE "team_capabilities" (
	"team_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	CONSTRAINT "team_capabilities_team_id_skill_pk" PRIMARY KEY("team_id","skill")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"force" "team_force" NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"status" "team_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_lat_range" CHECK ("teams"."lat" between -90 and 90),
	CONSTRAINT "teams_lon_range" CHECK ("teams"."lon" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "volunteer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"available" boolean DEFAULT false NOT NULL,
	"lat" double precision,
	"lon" double precision,
	"location_at" timestamp with time zone,
	"offered_count" integer DEFAULT 0 NOT NULL,
	"accepted_count" integer DEFAULT 0 NOT NULL,
	"declined_count" integer DEFAULT 0 NOT NULL,
	"withdrawn_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "volunteer_profiles_location_whole" CHECK (("volunteer_profiles"."lat" is null) = ("volunteer_profiles"."lon" is null) and ("volunteer_profiles"."lat" is null) = ("volunteer_profiles"."location_at" is null)),
	CONSTRAINT "volunteer_profiles_lat_range" CHECK ("volunteer_profiles"."lat" between -90 and 90),
	CONSTRAINT "volunteer_profiles_lon_range" CHECK ("volunteer_profiles"."lon" between -180 and 180),
	CONSTRAINT "volunteer_profiles_available_has_location" CHECK (not "volunteer_profiles"."available" or "volunteer_profiles"."lat" is not null),
	CONSTRAINT "volunteer_profiles_counts_nonneg" CHECK (least("volunteer_profiles"."offered_count", "volunteer_profiles"."accepted_count", "volunteer_profiles"."declined_count", "volunteer_profiles"."withdrawn_count", "volunteer_profiles"."completed_count") >= 0)
);
--> statement-breakpoint
CREATE TABLE "volunteer_skills" (
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"status" "skill_status" DEFAULT 'unverified' NOT NULL,
	"verified_by" uuid,
	"verified_at" timestamp with time zone,
	CONSTRAINT "volunteer_skills_user_id_skill_pk" PRIMARY KEY("user_id","skill"),
	CONSTRAINT "volunteer_skills_verifier_matches_status" CHECK (("volunteer_skills"."status" = 'unverified') = ("volunteer_skills"."verified_by" is null) and ("volunteer_skills"."verified_by" is null) = ("volunteer_skills"."verified_at" is null))
);
--> statement-breakpoint
ALTER TABLE "rescue_requests" ADD COLUMN "severity_override" integer;--> statement-breakpoint
ALTER TABLE "rescue_requests" ADD COLUMN "first_recommended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_request_id_rescue_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."rescue_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_volunteer_id_volunteer_profiles_user_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_approved_selection_fk" FOREIGN KEY ("selection_id","selection_status") REFERENCES "public"."selections"("id","status") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_entries" ADD CONSTRAINT "audit_entries_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_weights" ADD CONSTRAINT "scoring_weights_location_requested_by_users_id_fk" FOREIGN KEY ("location_requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_responders" ADD CONSTRAINT "selection_responders_selection_id_selections_id_fk" FOREIGN KEY ("selection_id") REFERENCES "public"."selections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_responders" ADD CONSTRAINT "selection_responders_volunteer_id_volunteer_profiles_user_id_fk" FOREIGN KEY ("volunteer_id") REFERENCES "public"."volunteer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selection_responders" ADD CONSTRAINT "selection_responders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selections" ADD CONSTRAINT "selections_request_id_rescue_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."rescue_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selections" ADD CONSTRAINT "selections_selected_by_users_id_fk" FOREIGN KEY ("selected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "selections" ADD CONSTRAINT "selections_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_capabilities" ADD CONSTRAINT "team_capabilities_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_user_id_volunteer_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."volunteer_profiles"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_one_active_volunteer" ON "assignments" USING btree ("volunteer_id") WHERE "assignments"."status" in ('offered', 'accepted');--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_one_active_team" ON "assignments" USING btree ("team_id") WHERE "assignments"."status" = 'deployed';--> statement-breakpoint
CREATE INDEX "assignments_request_idx" ON "assignments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "audit_entries_created_idx" ON "audit_entries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "selections_request_idx" ON "selections" USING btree ("request_id");--> statement-breakpoint
ALTER TABLE "rescue_requests" ADD CONSTRAINT "rescue_requests_override_range" CHECK ("rescue_requests"."severity_override" is null or "rescue_requests"."severity_override" between 1 and 5);--> statement-breakpoint
-- Hand-written below this line (RULES.md -> Database Rules).
-- The one settings row, with the PRD's initial weights.
INSERT INTO "scoring_weights" ("id") VALUES (1);--> statement-breakpoint
-- AC17: the audit log is append-only. The trigger holds even for a table owner or superuser;
-- the REVOKE takes the rights away from the app role, which owns the table (D-056).
CREATE FUNCTION "audit_entries_reject_change"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_entries is append-only: % is not allowed', TG_OP;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "audit_entries_no_update_delete" BEFORE UPDATE OR DELETE ON "audit_entries"
  FOR EACH ROW EXECUTE FUNCTION "audit_entries_reject_change"();--> statement-breakpoint
CREATE TRIGGER "audit_entries_no_truncate" BEFORE TRUNCATE ON "audit_entries"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_entries_reject_change"();--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON "audit_entries" FROM CURRENT_USER;