ALTER TABLE "email_outbox" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
UPDATE "email_outbox" SET "dedupe_key" = 'legacy:' || "id"::text WHERE "dedupe_key" IS NULL;--> statement-breakpoint
ALTER TABLE "email_outbox" ALTER COLUMN "dedupe_key" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "email_outbox_dedupe_unique" ON "email_outbox" USING btree ("dedupe_key");
