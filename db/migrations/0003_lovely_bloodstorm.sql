CREATE TABLE "presenters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"location" text NOT NULL,
	"initials" text NOT NULL,
	"bio" text NOT NULL,
	"expertise" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "presenter_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "presenters_slug_unique" ON "presenters" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "presenters_active_name_idx" ON "presenters" USING btree ("is_active","name");--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_presenter_id_presenters_id_fk" FOREIGN KEY ("presenter_id") REFERENCES "public"."presenters"("id") ON DELETE set null ON UPDATE no action;