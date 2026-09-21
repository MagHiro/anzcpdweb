"use server";

import { headers } from "next/headers";
import { getServerSession } from "@/server/auth/session";
import { getPublishedClassBySlug } from "@/server/catalogue/queries";
import { bookingFormSchema, professionalIdentifierSchema, toFormObject } from "@/lib/validation";
import { getClientIp, publicErrorMessage } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";
import { createBookingCheckout } from "@/server/bookings/service";

export type BookingActionState = {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function zodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export async function createBookingCheckoutAction(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const values = toFormObject(formData);
  const parsed = bookingFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Review the highlighted fields before continuing.", fieldErrors: zodFieldErrors(parsed.error) };

  const requestHeaders = await headers();
  const ip = getClientIp(requestHeaders);
  const allowed = await consumeRateLimit({ key: `booking:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!allowed) return { ok: false, error: "Too many booking attempts. Please wait a few minutes and try again." };
  const turnstile = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip });
  if (!turnstile.ok) return { ok: false, error: turnstile.message, fieldErrors: { turnstileToken: turnstile.message } };

  const classRecord = await getPublishedClassBySlug(parsed.data.classSlug);
  if (!classRecord) return { ok: false, error: "This class is no longer available. Return to the class catalogue for current options." };
  const identifier = professionalIdentifierSchema(classRecord.country, classRecord.professionalIdentifierRequired).safeParse(parsed.data.professionalIdentifier ?? "");
  if (!identifier.success) return { ok: false, error: "Enter the professional identifier in the requested format.", fieldErrors: { professionalIdentifier: identifier.error.issues[0]?.message ?? "Invalid identifier." } };

  try {
    const session = await getServerSession();
    const result = await createBookingCheckout({
      classSlug: parsed.data.classSlug,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      professionalIdentifier: identifier.data || undefined,
      createAccountRequested: !session && parsed.data.createAccountRequested === "on",
      termsAcceptedAt: new Date(),
      refundPolicyAcceptedAt: new Date(),
      idempotencyKey: parsed.data.idempotencyKey,
      userId: session?.user.id,
    });
    return { ok: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    return { ok: false, error: publicErrorMessage(error, "We couldn't start the booking. Check the class availability and try again.") };
  }
}
