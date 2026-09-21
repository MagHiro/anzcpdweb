import { and, eq, gt, isNull } from "drizzle-orm";
import { accountClaimTokens, bookings, categories, classes, payments } from "@/db/schema";
import { getDb } from "@/lib/db";
import { hashToken } from "@/server/auth/tokens";

export async function getGuestBookingByToken(rawToken: string) {
  const [row] = await getDb()
    .select({ token: accountClaimTokens, booking: bookings, payment: payments, classTitle: classes.title, classSlug: classes.slug, startAt: classes.startAt, endAt: classes.endAt, deliveryFormat: classes.deliveryFormat, venueName: classes.venueName, onlineAttendanceInfo: classes.onlineAttendanceInfo, categoryName: categories.name })
    .from(accountClaimTokens)
    .innerJoin(bookings, eq(accountClaimTokens.bookingId, bookings.id))
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .innerJoin(categories, eq(classes.categoryId, categories.id))
    .where(and(eq(accountClaimTokens.tokenHash, hashToken(rawToken)), eq(accountClaimTokens.purpose, "GUEST_BOOKING_ACCESS"), isNull(accountClaimTokens.usedAt), gt(accountClaimTokens.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}
