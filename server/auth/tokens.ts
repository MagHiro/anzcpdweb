import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { accountClaimTokens, bookings, user } from "@/db/schema";
import { getDb } from "@/lib/db";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAccountToken(input: {
  email: string;
  purpose: "ACCOUNT_SETUP" | "ACCOUNT_CLAIM" | "GUEST_BOOKING_ACCESS";
  bookingId?: string;
  expiresInMs?: number;
}): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  await getDb().insert(accountClaimTokens).values({
    tokenHash: hashToken(rawToken),
    email: input.email.toLowerCase(),
    bookingId: input.bookingId,
    purpose: input.purpose,
    expiresAt: new Date(Date.now() + (input.expiresInMs ?? 48 * 60 * 60 * 1000)),
  });
  return rawToken;
}

export async function consumeAccountToken(rawToken: string, purpose: "ACCOUNT_SETUP" | "ACCOUNT_CLAIM" | "GUEST_BOOKING_ACCESS", expectedEmail?: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const conditions = [eq(accountClaimTokens.tokenHash, hashToken(rawToken)), eq(accountClaimTokens.purpose, purpose), isNull(accountClaimTokens.usedAt), gt(accountClaimTokens.expiresAt, new Date())];
    if (expectedEmail) conditions.push(eq(accountClaimTokens.email, expectedEmail.toLowerCase()));
    const [token] = await tx
      .select()
      .from(accountClaimTokens)
      .where(and(...conditions))
      .limit(1);
    if (!token) return null;
    const [consumed] = await tx
      .update(accountClaimTokens)
      .set({ usedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(accountClaimTokens.id, token.id), isNull(accountClaimTokens.usedAt)))
      .returning();
    return consumed ?? null;
  });
}

export async function linkVerifiedEmailBookings(email: string, userId: string): Promise<number> {
  const result = await getDb()
    .update(bookings)
    .set({ userId, updatedAt: new Date() })
    .where(and(eq(bookings.email, email.toLowerCase()), isNull(bookings.userId)))
    .returning({ id: bookings.id });
  return result.length;
}

export async function markUserEmailVerified(userId: string): Promise<void> {
  await getDb().update(user).set({ emailVerified: true, updatedAt: new Date() }).where(eq(user.id, userId));
}
