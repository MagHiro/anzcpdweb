import { and, eq, gt, lte, sql } from "drizzle-orm";
import { bookings, classPromoCodes, payments, type classes } from "@/db/schema";
import type { Database } from "@/lib/db";

export type PromoQuote = { promoCodeId: string; discountMinorUnits: number; amount: number; currency: string };
export type PromoInput = { code: string } | { linkToken: string };

export class BookingQuoteError extends Error {}

export const unavailablePromo = "This promo is unavailable for this booking. Check the code or link and try again.";

// Paid (including refunded) and fully discounted bookings count permanently.
// Pending payments keep their place until Stripe confirms a terminal failure.
export const promoUsageCount = sql<number>`(${sql`
  SELECT count(*)::int
  FROM ${bookings}
  INNER JOIN ${payments} ON ${payments.bookingId} = ${bookings.id}
  WHERE ${bookings.promoCodeId} = ${classPromoCodes.id} AND ${payments.status} <> 'FAILED'
`})`;

export async function getBookingPromo(
  db: Pick<Database, "select">,
  activity: Pick<typeof classes.$inferSelect, "id" | "promoMode" | "priceMinorUnits" | "currency">,
  input: PromoInput,
  now = new Date(),
) {
  if (activity.promoMode === "DISABLED" || ("code" in input && activity.promoMode !== "CODE_AND_LINK")) return null;

  const [promo] = await db.select({
    id: classPromoCodes.id,
    code: classPromoCodes.code,
    type: classPromoCodes.discountType,
    value: classPromoCodes.discountValue,
  })
    .from(classPromoCodes)
    .where(and(
      eq(classPromoCodes.classId, activity.id),
      "code" in input ? eq(classPromoCodes.code, input.code) : eq(classPromoCodes.linkToken, input.linkToken),
      eq(classPromoCodes.isActive, true),
      lte(classPromoCodes.validFrom, now),
      gt(classPromoCodes.validUntil, now),
      sql`(${classPromoCodes.maxUses} IS NULL OR ${promoUsageCount} < ${classPromoCodes.maxUses})`,
    ))
    .limit(1);
  if (!promo) return null;

  const discountMinorUnits = promo.type === "PERCENT"
    ? Math.round(activity.priceMinorUnits * promo.value / 100)
    : Math.min(activity.priceMinorUnits, promo.value);
  const amount = activity.priceMinorUnits - discountMinorUnits;
  // Stripe's minimum card charge is 50 cents in AUD and NZD.
  if (discountMinorUnits === 0 || (amount > 0 && amount < 50)) return null;
  const quote: PromoQuote = { promoCodeId: promo.id, discountMinorUnits, amount, currency: activity.currency };
  return { quote, code: promo.code };
}
