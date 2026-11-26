CREATE TYPE "public"."promo_discount_type" AS ENUM('PERCENT', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."promo_mode" AS ENUM('DISABLED', 'LINK_ONLY', 'CODE_AND_LINK');--> statement-breakpoint
CREATE TABLE "class_promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"code" text NOT NULL,
	"link_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"discount_type" "promo_discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_promo_codes_validity" CHECK ("class_promo_codes"."valid_until" > "class_promo_codes"."valid_from"),
	CONSTRAINT "class_promo_codes_discount" CHECK ("class_promo_codes"."discount_value" > 0 AND ("class_promo_codes"."discount_type" <> 'PERCENT' OR "class_promo_codes"."discount_value" <= 100))
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "promo_code_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "promo_code_snapshot" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "discount_minor_units" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "promo_mode" "promo_mode" DEFAULT 'DISABLED' NOT NULL;--> statement-breakpoint
ALTER TABLE "class_promo_codes" ADD CONSTRAINT "class_promo_codes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_promo_codes_class_code_unique" ON "class_promo_codes" USING btree ("class_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "class_promo_codes_link_token_unique" ON "class_promo_codes" USING btree ("link_token");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_promo_code_id_class_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."class_promo_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_discount_valid" CHECK (("bookings"."discount_minor_units" = 0 AND "bookings"."promo_code_id" IS NULL AND "bookings"."promo_code_snapshot" IS NULL) OR ("bookings"."discount_minor_units" > 0 AND "bookings"."promo_code_id" IS NOT NULL AND "bookings"."promo_code_snapshot" IS NOT NULL));