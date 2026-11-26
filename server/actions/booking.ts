"use server";

import { headers } from "next/headers";
import { getServerSession } from "@/server/auth/session";
import { getPublishedClassBySlug } from "@/server/catalogue/queries";
import { bookingFormSchema, professionalIdentifierSchema, promoCodeSchema, slugSchema, toFormObject } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { getClientIp, publicErrorMessage } from "@/lib/utils";
import { consumeRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";
import { createBookingCheckout } from "@/server/bookings/service";
import { BookingQuoteError, getBookingPromo, unavailablePromo, type PromoQuote } from "@/server/bookings/promos";

export type BookingActionState = {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function zodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export async function previewBookingPromoAction(classSlug: string, promoCode: string): Promise<{ quote: PromoQuote } | { error: string }> {
  const slug = slugSchema.safeParse(classSlug);
  const code = promoCodeSchema.safeParse(promoCode);
  if (!slug.success || !code.success) return { error: unavailablePromo };

  const ip = getClientIp(await headers());
  const allowed = await consumeRateLimit({ key: `booking-promo:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!allowed) return { error: "Too many promo attempts. Please wait a few minutes and try again." };
  const activity = await getPublishedClassBySlug(slug.data);
  if (!activity?.isBookingOpen) return { error: unavailablePromo };
  const promo = await getBookingPromo(getDb(), activity, { code: code.data });
  return promo ? { quote: promo.quote } : { error: unavailablePromo };
}

export async function createBookingCheckoutAction(_previous: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const values = toFormObject(formData);
  const parsed = bookingFormSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Review the highlighted fields before continuing.", fieldErrors: zodFieldErrors(parsed.error) };
  const { promoCode, promoLink, promoCodeId, expectedAmount, expectedCurrency } = parsed.data;
  if ((promoCode && promoLink) || Boolean(promoCode || promoLink) !== Boolean(promoCodeId)
    || (expectedAmount === undefined) !== (expectedCurrency === undefined) || (promoCodeId && expectedAmount === undefined)) {
    return { ok: false, error: "Review the promo and booking total before continuing." };
  }

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
      promo: promoLink ? { linkToken: promoLink } : promoCode ? { code: promoCode } : undefined,
      expectedPrice: expectedAmount !== undefined && expectedCurrency ? { amount: expectedAmount, currency: expectedCurrency, promoCodeId } : undefined,
    });
    return { ok: true, checkoutUrl: result.checkoutUrl };
  } catch (error) {
    if (error instanceof BookingQuoteError) return { ok: false, error: error.message };
    return { ok: false, error: publicErrorMessage(error, "We couldn't start the booking. Check the class availability and try again.") };
  }
}
