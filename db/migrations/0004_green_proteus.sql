CREATE TABLE "payment_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_email" text NOT NULL,
	"class_title" text NOT NULL,
	"amount_paid" integer NOT NULL,
	"currency" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_receipts_payment_unique" ON "payment_receipts" USING btree ("payment_id");
--> statement-breakpoint
INSERT INTO payment_receipts (payment_id, booking_id, recipient_name, recipient_email, class_title, amount_paid, currency, paid_at)
SELECT p.id, b.id, b.full_name, b.email, b.class_title_snapshot, p.amount_captured, p.currency, b.paid_at
FROM payments p JOIN bookings b ON b.id = p.booking_id
WHERE b.paid_at IS NOT NULL AND p.status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED', 'REFUNDED')
ON CONFLICT (payment_id) DO NOTHING;
