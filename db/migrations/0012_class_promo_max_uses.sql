ALTER TABLE "class_promo_codes" ADD COLUMN "max_uses" integer;--> statement-breakpoint
CREATE INDEX "bookings_promo_code_idx" ON "bookings" USING btree ("promo_code_id") WHERE "bookings"."promo_code_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "class_promo_codes" ADD CONSTRAINT "class_promo_codes_max_uses_positive" CHECK ("class_promo_codes"."max_uses" > 0);