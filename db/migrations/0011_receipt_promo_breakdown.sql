ALTER TABLE "payment_receipts" ADD COLUMN "original_amount" integer;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "promo_code" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "discount_minor_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "payment_receipts" AS receipt
SET "original_amount" = booking."amount_snapshot" + booking."discount_minor_units",
    "promo_code" = booking."promo_code_snapshot",
    "discount_minor_units" = booking."discount_minor_units"
FROM "bookings" AS booking
WHERE receipt."booking_id" = booking."id"
  AND booking."promo_code_snapshot" IS NOT NULL;
