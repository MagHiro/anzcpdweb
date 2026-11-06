ALTER TABLE "bookings" ADD COLUMN "attendance" text DEFAULT 'NOT_RECORDED' NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "attendance_recorded_at" timestamp with time zone;