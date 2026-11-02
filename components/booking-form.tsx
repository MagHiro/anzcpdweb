"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createBookingCheckoutAction, type BookingActionState } from "@/server/actions/booking";
import { CountryBadge, Field, FormNotice, TextInput } from "@/components/ui";
import { Turnstile } from "@/components/turnstile";
import { getIdentifierLabel, getCpdLabel } from "@/lib/domain/countries";
import { formatMoney } from "@/lib/utils";
import { VisitorTime } from "@/components/visitor-time";

export type BookingClass = Pick<NonNullable<import("@/server/catalogue/queries").PublicClass>, "slug" | "country" | "title" | "startAt" | "timezone" | "deliveryFormat" | "cpdUnitType" | "cpdUnitAmount" | "priceMinorUnits" | "currency" | "professionalIdentifierRequired">;
const initialState: BookingActionState = { ok: false };

export function BookingForm({ classRecord, siteKey }: { classRecord: BookingClass; siteKey?: string }) {
  const [state, formAction, pending] = useActionState(createBookingCheckoutAction, initialState);
  const [review, setReview] = useState<{ name: string; email: string } | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [idempotencyKey] = useState(() => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000");
  useEffect(() => { if (state.ok && state.checkoutUrl) window.location.assign(state.checkoutUrl); }, [state]);
  const cpd = getCpdLabel(classRecord.cpdUnitType, classRecord.cpdUnitAmount);
  const free = classRecord.priceMinorUnits === 0;
  return <form action={formAction} className="booking-form" onChange={() => setReview(null)} onSubmit={event => {
    if (review) return;
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get("email")).trim().toLowerCase() !== String(data.get("emailConfirmation")).trim().toLowerCase()) {
      setReviewError("The email addresses must match."); return;
    }
    setReviewError(""); setReview({ name: String(data.get("fullName")), email: String(data.get("email")) });
  }}>
    <input type="hidden" name="classSlug" value={classRecord.slug} />
    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    <input type="hidden" name="turnstileToken" value={turnstileToken} />
    <aside className="booking-summary">
      <div className="flex flex-wrap items-center justify-between gap-3"><CountryBadge country={classRecord.country} /><span className="text-sm font-bold text-[var(--forest)]">{free ? "Free" : formatMoney(classRecord.priceMinorUnits, classRecord.currency)}</span></div>
      <h2 className="display mt-5 text-3xl leading-tight text-[var(--forest)] sm:text-4xl">{classRecord.title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]"><VisitorTime startAt={new Date(classRecord.startAt).toISOString()} timezone={classRecord.timezone} allowConversion={classRecord.deliveryFormat === "ONLINE"} showSelector />{cpd ? <span className="mt-2 block">{cpd}</span> : null}</p>
      <div className="booking-summary-total"><span>Total</span><strong>{free ? "Free" : formatMoney(classRecord.priceMinorUnits, classRecord.currency)}</strong></div>
      <p className="booking-summary-note">{free ? "No payment required. Your place is confirmed when you complete this form." : "Your place is held briefly during Stripe Checkout. Do not start another payment while checkout is processing."}</p>
      <Link href={`/classes/${classRecord.slug}`} className="booking-summary-link">View activity details ↗</Link>
    </aside>
    <div className="booking-form-main">
    <FormNotice>{reviewError || state.error}</FormNotice>
    <section className="booking-form-section" aria-labelledby="attendee-heading">
      <h2 id="attendee-heading">Attendee details</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required error={state.fieldErrors?.fullName}><TextInput name="fullName" autoComplete="name" required placeholder="Your full name" /></Field>
        <Field label="Email address" required error={state.fieldErrors?.email}><TextInput name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></Field>
        <Field label="Confirm email address" required error={state.fieldErrors?.emailConfirmation}><TextInput name="emailConfirmation" type="email" autoComplete="email" required placeholder="Repeat your email" /></Field>
        <Field label={getIdentifierLabel(classRecord.country)} hint={classRecord.professionalIdentifierRequired ? "Required for this class. The academy does not verify registration status." : "Optional unless the class requires it."} required={classRecord.professionalIdentifierRequired} error={state.fieldErrors?.professionalIdentifier}><TextInput name="professionalIdentifier" inputMode={classRecord.country === "AU" ? "numeric" : "text"} placeholder={classRecord.country === "AU" ? "123456" : "IAA-12345"} required={classRecord.professionalIdentifierRequired} /></Field>
      </div>
    </section>
    <section className="booking-form-section booking-agreements" aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">Confirmation</h2>
      <label className="flex gap-3 text-sm leading-6 text-[var(--ink)]"><input className="mt-1 h-4 w-4 accent-[var(--forest)]" type="checkbox" name="createAccountRequested" /><span><strong>Create an account for me so I can manage this booking and future CPD registrations.</strong><br /><span className="text-[var(--muted)]">After {free ? "confirmation" : "payment"}, we’ll email a secure account setup link. We never send or generate a predictable password.</span></span></label>
      <label className="flex gap-3 text-sm leading-6 text-[var(--ink)]"><input className="mt-1 h-4 w-4 accent-[var(--forest)]" type="checkbox" name="termsAccepted" required /><span>I agree to the <Link href="/terms" target="_blank" className="font-bold underline decoration-[var(--signal)] underline-offset-4">terms</Link>.</span></label>
      <label className="flex gap-3 text-sm leading-6 text-[var(--ink)]"><input className="mt-1 h-4 w-4 accent-[var(--forest)]" type="checkbox" name="refundPolicyAccepted" required /><span>I acknowledge the <Link href="/refund-policy" target="_blank" className="font-bold underline decoration-[var(--signal)] underline-offset-4">refund and cancellation policy</Link>.</span></label>
    </section>
    <div><Turnstile siteKey={siteKey} onToken={setTurnstileToken} /><p className="mt-2 text-xs text-[var(--muted)]">{free ? "Your details are used to create this booking. No payment is required." : "Your details are used to create this booking and its payment record. We do not store card details."}</p></div>
    {review && <section aria-label="Review your booking" role="status" className="rounded-xl border-2 border-[var(--forest)] bg-white p-6">
      <h2 className="text-xl font-semibold">Review your booking</h2>
      <dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-[var(--muted)]">Attendee</dt><dd className="mt-1 font-semibold">{review.name}</dd></div><div><dt className="text-[var(--muted)]">Confirmation email</dt><dd className="mt-1 break-all font-semibold">{review.email}</dd></div><div><dt className="text-[var(--muted)]">Total</dt><dd className="mt-1 font-semibold">{formatMoney(classRecord.priceMinorUnits, classRecord.currency)}</dd></div></dl>
      <p className="mt-4 text-xs leading-6 text-[var(--muted)]">Check the activity and attendee details above. You can edit any field before continuing{free ? "." : "; no payment has been taken by this form."}</p>
    </section>}
    <button type="submit" disabled={pending} className="focus-ring flex min-h-12 w-full items-center justify-center rounded-lg bg-[var(--forest)] px-5 text-sm font-bold text-white transition hover:bg-[var(--fern)] disabled:opacity-60">{pending ? "Reserving your place…" : !review ? "Review booking" : free ? "Confirm booking" : `Continue to secure payment · ${formatMoney(classRecord.priceMinorUnits, classRecord.currency)}`}</button>
    {!free && <p className="text-center text-xs leading-5 text-[var(--muted)]">Stripe Checkout handles payment. Returning to this page is not proof of payment; your booking is confirmed after provider verification.</p>}
    </div>
  </form>;
}
