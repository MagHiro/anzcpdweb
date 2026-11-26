"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { createBookingCheckoutAction, previewBookingPromoAction, type BookingActionState } from "@/server/actions/booking";
import { ActivityDetailIcon, Button, Field, FormNotice, TextInput } from "@/components/ui";
import type { PromoQuote } from "@/server/bookings/promos";
import { ArrowRight, CloseIcon } from "@/components/icon";
import { Turnstile } from "@/components/turnstile";
import { getIdentifierLabel, getCpdLabel } from "@/lib/domain/countries";
import { formatMoney } from "@/lib/utils";
import { VisitorTime } from "@/components/visitor-time";

export type BookingClass = Pick<NonNullable<import("@/server/catalogue/queries").PublicClass>, "slug" | "country" | "title" | "startAt" | "timezone" | "deliveryFormat" | "cpdUnitType" | "cpdUnitAmount" | "priceMinorUnits" | "currency" | "professionalIdentifierRequired">;
const initialState: BookingActionState = { ok: false };

type AppliedPromo = ({ code: string } | { linkToken: string }) & { quote: PromoQuote };

export function BookingForm({ classRecord, siteKey, allowManualPromo, linkedPromo, invalidPromoLink }: {
  classRecord: BookingClass;
  siteKey?: string;
  allowManualPromo: boolean;
  linkedPromo?: AppliedPromo;
  invalidPromoLink: boolean;
}) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileAttempt, setTurnstileAttempt] = useState(0);
  const [state, formAction, pending] = useActionState(async (previous: BookingActionState, data: FormData) => {
    const result = await createBookingCheckoutAction(previous, data);
    if (!result.ok) {
      setTurnstileToken("");
      setTurnstileAttempt(attempt => attempt + 1);
    }
    return result;
  }, initialState);
  const [promo, setPromo] = useState(linkedPromo);
  const [promoDraft, setPromoDraft] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoPending, setPromoPending] = useState(false);
  const [review, setReview] = useState<{ name: string; email: string } | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);
  const reviewTitleId = useId();
  const [idempotencyKey] = useState(() => typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000");
  useEffect(() => { if (state.ok && state.checkoutUrl) window.location.assign(state.checkoutUrl); }, [state]);
  useEffect(() => { if (review && !dialog.current?.open) dialog.current?.showModal(); }, [review]);
  const cpd = getCpdLabel(classRecord.cpdUnitType, classRecord.cpdUnitAmount);
  const amount = promo?.quote.amount ?? classRecord.priceMinorUnits;
  const currency = promo?.quote.currency ?? classRecord.currency;
  const free = amount === 0;
  const total = formatMoney(amount, currency);
  const savings = promo && formatMoney(promo.quote.discountMinorUnits, currency);
  const classTime = { startAt: new Date(classRecord.startAt).toISOString(), timezone: classRecord.timezone, allowConversion: classRecord.deliveryFormat === "ONLINE" };
  const busy = pending || state.ok;
  const closeReview = () => { if (!busy) dialog.current?.close(); };
  async function applyPromo() {
    if (!promoDraft.trim() || promoPending || busy) return;
    setPromoPending(true);
    setPromoError("");
    try {
      const result = await previewBookingPromoAction(classRecord.slug, promoDraft);
      if ("error" in result) setPromoError(result.error);
      else setPromo({ code: promoDraft.trim().toUpperCase(), quote: result.quote });
    } catch {
      setPromoError("The promo code could not be checked. Please try again.");
    } finally {
      setPromoPending(false);
    }
  }

  return <form method="post" className="booking-form" onSubmit={event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy || promoPending || !form.reportValidity()) return;
    if (!promo && allowManualPromo && promoDraft.trim()) {
      setPromoError("Apply the promo code or clear the field before reviewing your booking.");
      return;
    }
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
    <input type="hidden" name="expectedAmount" value={amount} />
    <input type="hidden" name="expectedCurrency" value={currency} />
    {promo && <>
      <input type="hidden" name="promoCodeId" value={promo.quote.promoCodeId} />
      {"code" in promo ? <input type="hidden" name="promoCode" value={promo.code} /> : <input type="hidden" name="promoLink" value={promo.linkToken} />}
    </>}
    <aside className="booking-summary" aria-labelledby="booking-class-title">
      <h2 id="booking-class-title">{classRecord.title}</h2>
      <div className="booking-summary-meta">
        <div><ActivityDetailIcon kind="calendar" /><VisitorTime {...classTime} /></div>
        {cpd && <div><ActivityDetailIcon kind="clock" /><span>{cpd}</span></div>}
      </div>
      {promo && <p className="booking-summary-note">Promo discount: −{savings}</p>}
      <div className="booking-summary-total"><span>Total</span><strong>{free ? "Free" : total}</strong></div>
      <p className="booking-summary-note">{free ? "No payment required." : "Pay with Stripe. Wait for checkout to finish before trying again."}</p>
    </aside>
    <div className="booking-form-main">
    <FormNotice>{reviewError || state.error}</FormNotice>
    {invalidPromoLink && <FormNotice tone="info">This promo link is unavailable. No discount has been applied from the link.</FormNotice>}
    <section className="booking-form-section" aria-labelledby="attendee-heading">
      <h2 id="attendee-heading">Attendee details</h2>
      <div className="booking-attendee-fields">
        <Field label="Full name" required error={state.fieldErrors?.fullName}><TextInput name="fullName" autoComplete="name" required /></Field>
        <Field label={`${getIdentifierLabel(classRecord.country)}${classRecord.professionalIdentifierRequired ? "" : " (optional)"}`} required={classRecord.professionalIdentifierRequired} error={state.fieldErrors?.professionalIdentifier}><TextInput name="professionalIdentifier" inputMode={classRecord.country === "AU" ? "numeric" : "text"} placeholder={classRecord.country === "AU" ? "123456" : "IAA-12345"} required={classRecord.professionalIdentifierRequired} /></Field>
        <Field label="Email address" required error={state.fieldErrors?.email}><TextInput name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></Field>
        <Field label="Confirm email address" required error={state.fieldErrors?.emailConfirmation}><TextInput name="emailConfirmation" type="email" autoComplete="email" required /></Field>
      </div>
    </section>
    {(promo || allowManualPromo) && <section className="booking-form-section" aria-labelledby="promo-heading">
      <h2 id="promo-heading">Promo discount</h2>
      {promo ? <div className="flex flex-wrap items-center gap-3">
        <p role="status">{"code" in promo ? `${promo.code} applied` : "Promo applied"} · {savings} off</p>
        <Button type="button" variant="quiet" size="sm" disabled={busy} onClick={() => { setPromo(undefined); setPromoDraft(""); }}>Remove discount</Button>
      </div> : <div className="flex flex-wrap items-end gap-3">
        <Field label="Promo code" className="min-w-0 flex-1" error={promoError}>
          <TextInput value={promoDraft} disabled={busy || promoPending} maxLength={32} autoComplete="off"
            onChange={event => { setPromoDraft(event.target.value); setPromoError(""); }}
            onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void applyPromo(); } }} />
        </Field>
        <Button type="button" variant="secondary" disabled={busy || promoPending || !promoDraft.trim()} onClick={applyPromo}>
          {promoPending ? "Checking…" : "Apply"}
        </Button>
      </div>}
    </section>}
    <section className="booking-form-section booking-agreements" aria-labelledby="confirmation-heading">
      <h2 id="confirmation-heading">Booking terms</h2>
      <div className="booking-policy-list">
        <label><input type="checkbox" name="termsAccepted" required /><span>I agree to the <Link href="/terms" target="_blank">terms</Link>.</span></label>
        <label><input type="checkbox" name="refundPolicyAccepted" required /><span>I acknowledge the <Link href="/refund-policy" target="_blank">refund and cancellation policy</Link>.</span></label>
      </div>
      <label className="booking-account-option"><input type="checkbox" name="createAccountRequested" /><span>Create an account to manage my bookings.<small>We’ll email a setup link after {free ? "confirmation" : "payment"}.</small></span></label>
    </section>
    <Turnstile key={turnstileAttempt} siteKey={siteKey} onToken={setTurnstileToken} />
    <button ref={reviewButton} type="submit" aria-haspopup="dialog" disabled={busy || promoPending} className="booking-submit focus-ring">Review booking <ArrowRight /></button>
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
        <dl className="booking-review-total">
          {promo && <div><dt>Promo discount</dt><dd>−{savings}</dd></div>}
          <div><dt>Total to pay</dt><dd>{total}</dd></div>
        </dl>
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
