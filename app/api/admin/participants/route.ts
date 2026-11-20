import { eq } from "drizzle-orm";
import { z } from "zod";
import { classes } from "@/db/schema";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security/origin";
import { requestAdmin } from "@/server/auth/admin-request";
import { createBookingCheckout } from "@/server/bookings/service";
import { consumeRateLimit } from "@/server/security/rate-limit";

const schema = z.object({
  classId: z.uuid(), requestId: z.uuid(), fullName: z.string().trim().min(1).max(180),
  email: z.email().max(254).transform(value => value.toLowerCase()),
  professionalIdentifier: z.string().trim().max(80).optional(),
  mode: z.enum(["LINK", "VERIFIED"]), reference: z.string().trim().max(500).optional(),
  policiesConfirmed: z.literal(true),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  const admin = await requestAdmin(request.headers);
  if (!admin) return Response.json({ error: "Administrator access required." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > 8192) return Response.json({ error: "Request too large." }, { status: 413 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid participant details." }, { status: 400 });
  if (!await consumeRateLimit({ key: `admin-participant:${admin.id}`, limit: 30, windowMs: 60000 })) return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  const data = parsed.data;
  const [activity] = await getDb().select({ slug: classes.slug }).from(classes).where(eq(classes.id, data.classId)).limit(1);
  if (!activity) return Response.json({ error: "Class not found." }, { status: 404 });
  try {
    const now = new Date();
    const result = await createBookingCheckout({
      classSlug: activity.slug, fullName: data.fullName, email: data.email,
      professionalIdentifier: data.professionalIdentifier, createAccountRequested: true,
      termsAcceptedAt: now, refundPolicyAcceptedAt: now,
      idempotencyKey: `admin:${admin.id}:${data.classId}:${data.mode}:${data.requestId}`,
    }, { actorId: admin.id, mode: data.mode, reference: data.reference });
    return Response.json({ bookingId: result.booking.id, confirmed: result.booking.status === "CONFIRMED", paymentUrl: result.booking.status === "CONFIRMED" ? null : result.checkoutUrl, expiresAt: result.booking.seatReservationExpiresAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Participant could not be added." }, { status: 400 });
  }
}
