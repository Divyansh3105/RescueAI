CREATE TYPE "public"."hazard_type" AS ENUM('flood', 'landslide');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'in_progress', 'resolved', 'cancelled');--> statement-breakpoint
CREATE TABLE "rescue_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY (sequence name "rescue_requests_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1000 CACHE 1),
	"hazard" "hazard_type" NOT NULL,
	"lat" double precision NOT NULL,
	"lon" double precision NOT NULL,
	"phone" text NOT NULL,
	"contact_name" text,
	"affected" integer,
	"trapped" integer,
	"injured" integer,
	"flag_children" boolean DEFAULT false NOT NULL,
	"flag_elderly" boolean DEFAULT false NOT NULL,
	"flag_injured" boolean DEFAULT false NOT NULL,
	"flag_disability" boolean DEFAULT false NOT NULL,
	"description" text,
	"severity" integer NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rescue_requests_seq_unique" UNIQUE("seq"),
	CONSTRAINT "rescue_requests_lat_range" CHECK ("rescue_requests"."lat" between -90 and 90),
	CONSTRAINT "rescue_requests_lon_range" CHECK ("rescue_requests"."lon" between -180 and 180),
	CONSTRAINT "rescue_requests_severity_range" CHECK ("rescue_requests"."severity" between 1 and 5),
	CONSTRAINT "rescue_requests_counts_nonneg" CHECK (coalesce("rescue_requests"."affected", 0) >= 0 and coalesce("rescue_requests"."trapped", 0) >= 0 and coalesce("rescue_requests"."injured", 0) >= 0)
);
--> statement-breakpoint
CREATE INDEX "rescue_requests_status_idx" ON "rescue_requests" USING btree ("status");