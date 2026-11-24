"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { createBookingCheckoutAction, type BookingActionState } from "@/server/actions/booking";
import { ActivityDetailIcon, Field, FormNotice, TextInput } from "@/components/ui";
import { ArrowRight, CloseIcon } from "@/components/icon";
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
  const [attempted, setAttempted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const reviewTitleId = useId();
  const [turnstileToken, setTurnstileToken] = useState("");
  const [idempotencyKey] = useState(() => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000");
  useEffect(() => { if (state.ok && state.checkoutUrl) window.location.assign(state.checkoutUrl); }, [state]);
  useEffect(() => { if (review && !dialog.current?.open) dialog.current?.showModal(); }, [review]);
  const cpd = getCpdLabel(classRecord.cpdUnitType, classRecord.cpdUnitAmount);
  const free = classRecord.priceMinorUnits === 0;
  const total = formatMoney(classRecord.priceMinorUnits, classRecord.currency);
  const classTime = { startAt: new Date(classRecord.startAt).toISOString(), timezone: classRecord.timezone, allowConversion: classRecord.deliveryFormat === "ONLINE" };
  const busy = pending || state.ok;
  const closeReview = () => { if (!busy) dialog.current?.close(); };
  return <form method="post" className="booking-form" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy || !form.reportValidity()) return;
    const data = new FormData(form);
    if (String(data.get("email")).trim().toLowerCase() !== String(data.get("emailConfirmation")).trim().toLowerCase()) {
      setReviewError("The email addresses must match."); return;
    }
    if (dialog.current?.open) {
      if ((event.nativeEvent as SubmitEvent).submitter !== continueButton.current) return;
      setAttempted(true);
      startTransition(() => formAction(data));
      return;
    }
    setAttempted(false);
    setReviewError(""); setReview({ name: String(data.get("fullName")), email: String(data.get("email")) });
  }}>
    <input type="hidden" name="classSlug" value={classRecord.slug} />
    <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
    <input type="hidden" name="turnstileToken" value={turnstileToken} />
    <aside className="booking-summary" aria-labelledby="booking-class-title">
      <h2 id="booking-class-title">{classRecord.title}</h2>
      <div className="booking-summary-meta">
        <div><ActivityDetailIcon kind="calendar" /><VisitorTime {...classTime} /></div>
        {cpd && <div><ActivityDetailIcon kind="clock" /><span>{cpd}</span></div>}
      </div>
      <div className="booking-summary-total"><span>Total</span><strong>{free ? "Free" : total}</strong></div>
      <p className="booking-summary-note">{free ? "No payment required." : "Pay with Stripe. Wait for checkout to finish before trying again."}</p>
    </aside>
    <div className="booking-form-main">
    <FormNotice>{reviewError || state.error}</FormNotice>
    <section className="booking-form-section" aria-labelledby="attendee-heading">
      <h2 id="attendee-heading">Attendee details</h2>
      <div className="booking-attendee-fields">
        <Field label="Full name" required error={state.fieldErrors?.fullName}><TextInput name="fullName" autoComplete="name" required /></Field>
        <Field label={`${getIdentifierLabel(classRecord.country)}${classRecord.professionalIdentifierRequired ? "" : " (optional)"}`} required={classRecord.professionalIdentifierRequired} error={state.fieldErrors?.professionalIdentifier}><TextInput name="professionalIdentifier" inputMode={classRecord.country === "AU" ? "numeric" : "text"} placeholder={classRecord.country === "AU" ? "123456" : "IAA-12345"} required={classRecord.professionalIdentifierRequired} /></Field>
        <Field label="Email address" required error={state.fieldErrors?.email}><TextInput name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></Field>
        <Field label="Confirm email address" required error={state.fieldErrors?.emailConfirmation}><TextInput name="emailConfirmation" type="email" autoComplete="email" required /></Field>
      </div>
    </section>
    <section className="booking-form-section booking-agreements" aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">Booking terms</h2>
      <div className="booking-policy-list">
        <label><input type="checkbox" name="termsAccepted" required /><span>I agree to the <Link href="/terms" target="_blank">terms</Link>.</span></label>
        <label><input type="checkbox" name="refundPolicyAccepted" required /><span>I acknowledge the <Link href="/refund-policy" target="_blank">refund and cancellation policy</Link>.</span></label>
      </div>
      <label className="booking-account-option"><input type="checkbox" name="createAccountRequested" /><span>Create an account to manage my bookings.<small>We’ll email a setup link after {free ? "confirmation" : "payment"}.</small></span></label>
    </section>
    <Turnstile siteKey={siteKey} onToken={setTurnstileToken} />
    <button ref={reviewButton} type="submit" aria-haspopup="dialog" disabled={busy} className="booking-submit focus-ring">Review booking <ArrowRight /></button>
    <dialog ref={dialog} className="booking-review-dialog" aria-labelledby={reviewTitleId} onCancel={event => { event.preventDefault(); closeReview(); }} onClose={() => reviewButton.current?.focus()}>
      <div className="booking-review-heading"><h2 id={reviewTitleId}>Review your booking</h2><button type="button" className="booking-review-close focus-ring" aria-label="Close review" disabled={busy} onClick={closeReview}><CloseIcon /></button></div>
      {review && <>
        <section className="booking-review-class">
          <h3>{classRecord.title}</h3>
          <div className="booking-summary-date"><ActivityDetailIcon kind="calendar" /><VisitorTime {...classTime} /></div>
        </section>
        <dl className="booking-review-details">
          <div><dt>Attendee</dt><dd>{review.name}</dd></div>
          <div><dt>Confirmation email</dt><dd>{review.email}</dd></div>
        </dl>
        <dl className="booking-review-total"><div><dt>Total to pay</dt><dd>{total}</dd></div></dl>
      </>}
      <FormNotice>{attempted && !busy ? state.error : undefined}</FormNotice>
      <div className="booking-review-actions">
        <button type="button" className="booking-review-edit focus-ring" disabled={busy} onClick={closeReview}>Edit details</button>
        <button ref={continueButton} type="submit" disabled={busy} className="booking-submit focus-ring">{busy ? "Reserving your place…" : free ? "Confirm booking" : "Continue to payment"}{!busy && <ArrowRight />}</button>
      </div>
    </dialog>
    </div>
  </form>;
}
