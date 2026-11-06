import { and, asc, eq, inArray } from "drizzle-orm";
import { bookings, classResources } from "@/db/schema";
import { getDb } from "@/lib/db";

export async function participantHasResourceAccess(userId: string, classId: string) {
  const [row] = await getDb().select({ id: bookings.id }).from(bookings).where(and(eq(bookings.userId, userId), eq(bookings.classId, classId), inArray(bookings.status, ["CONFIRMED", "PARTIALLY_REFUNDED"])));
  return Boolean(row);
}

export async function getClassResources(classId: string, publishedOnly = false) {
  return getDb().select().from(classResources).where(and(eq(classResources.classId, classId), publishedOnly ? eq(classResources.published, true) : undefined)).orderBy(asc(classResources.createdAt), asc(classResources.id));
}
