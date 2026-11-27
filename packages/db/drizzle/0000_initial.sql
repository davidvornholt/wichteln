CREATE TABLE "access_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "access_links_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"year" integer NOT NULL,
	"person_id" uuid NOT NULL,
	"recipient_id" uuid,
	CONSTRAINT "participations_year_person_id_pk" PRIMARY KEY("year","person_id"),
	CONSTRAINT "participations_one_giver_per_recipient" UNIQUE("year","recipient_id"),
	CONSTRAINT "participations_nobody_gives_to_themselves" CHECK ("participations"."recipient_id" <> "participations"."person_id")
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"paper" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_name_unique" UNIQUE("name"),
	CONSTRAINT "people_paper_is_known" CHECK (paper in ('kirsch', 'tanne', 'kobalt', 'senf', 'pflaume'))
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"year" integer PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "wishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"person_id" uuid NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishes_title_is_not_blank" CHECK (btrim("wishes"."title") <> '')
);
--> statement-breakpoint
ALTER TABLE "access_links" ADD CONSTRAINT "access_links_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_year_seasons_year_fk" FOREIGN KEY ("year") REFERENCES "public"."seasons"("year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_recipient_takes_part" FOREIGN KEY ("year","recipient_id") REFERENCES "public"."participations"("year","person_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_link_id_access_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."access_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_belong_to_a_participation" FOREIGN KEY ("year","person_id") REFERENCES "public"."participations"("year","person_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_by_link" ON "sessions" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "wishes_by_participation" ON "wishes" USING btree ("year","person_id","created_at");