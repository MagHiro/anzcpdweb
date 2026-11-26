"use client";

import { startTransition, useActionState, useState } from "react";
import { Button, Field, FormNotice, Select, TextInput } from "@/components/ui";
import type { classes, classPromoCodes } from "@/db/schema";
import { toDateTimeLocalValue } from "@/lib/date";
import { saveClassPromoAction, savePromoModeAction } from "@/server/actions/promo";

export function ClassPromoModeForm({ classId, mode }: { classId: string; mode: typeof classes.$inferSelect.promoMode }) {
  const [state, action, pending] = useActionState(savePromoModeAction, { ok: false });
  const [selectedMode, setSelectedMode] = useState<string>(mode);
  return <form action={action} className="mt-4 max-w-lg space-y-4">
    <input type="hidden" name="classId" value={classId} />
    <Field label="Promo code availability" hint="Link only hides the promo code field on the booking page. Disabled turns off code entry and all promo links.">
      <Select name="promoMode" value={selectedMode} onChange={event => setSelectedMode(event.target.value)} disabled={pending}>
        <option value="DISABLED">Disabled</option>
        <option value="LINK_ONLY">Link only</option>
        <option value="CODE_AND_LINK">Manual code entry and links</option>
      </Select>
    </Field>
    <FormNotice tone={state.ok ? "success" : "error"}>{state.message}</FormNotice>
    <Button type="submit" disabled={pending}>Save promo settings</Button>
  </form>;
}

export function ClassPromoForm({ classId, currency, timezone, promo, link }: {
  classId: string;
  currency: string;
  timezone: string;
  promo?: typeof classPromoCodes.$inferSelect;
  link?: string;
}) {
  const [state, action, pending] = useActionState(saveClassPromoAction, { ok: false });
  const [discountType, setDiscountType] = useState(promo?.discountType ?? "PERCENT");
  const [discount, setDiscount] = useState(promo ? String(promo.discountType === "PERCENT" ? promo.discountValue : promo.discountValue / 100) : "");
  const [copyStatus, setCopyStatus] = useState("");

  return <form method="post" className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={event => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  }}>
    <input type="hidden" name="classId" value={classId} />
    <input type="hidden" name="id" value={promo?.id ?? ""} />
    <Field label="Code" hint={promo ? "Create a new promo to use a different code." : "3–32 letters, numbers, hyphens or underscores."} required>
      <TextInput name="code" defaultValue={promo?.code} readOnly={Boolean(promo)} minLength={3} maxLength={32} required />
    </Field>
    <Field label="Discount type" required>
      <Select name="discountType" value={discountType} onChange={event => setDiscountType(event.target.value === "FIXED" ? "FIXED" : "PERCENT")}>
        <option value="PERCENT">Percentage</option>
        <option value="FIXED">Fixed amount</option>
      </Select>
    </Field>
    <Field label={discountType === "PERCENT" ? "Percent off" : `Amount off (${currency})`} required>
      <TextInput name="discountValue" type="number" value={discount} onChange={event => setDiscount(event.target.value)}
        step={discountType === "PERCENT" ? 1 : 0.01} min={discountType === "PERCENT" ? 1 : 0.01}
        max={discountType === "PERCENT" ? 100 : 100_000} required />
    </Field>
    <label className="flex items-center gap-2 self-end py-3 text-sm font-semibold">
      <input type="checkbox" name="isActive" defaultChecked={promo?.isActive ?? true} /> Active
    </label>
    <Field label={`Valid from (${timezone})`} required>
      <TextInput name="validFrom" type="datetime-local" defaultValue={promo && toDateTimeLocalValue(promo.validFrom, timezone)} required />
    </Field>
    <Field label={`Valid until (${timezone})`} required>
      <TextInput name="validUntil" type="datetime-local" defaultValue={promo && toDateTimeLocalValue(promo.validUntil, timezone)} required />
    </Field>
    <Field label="Maximum uses" hint="Leave blank for unlimited. Pending checkouts reserve a use; completed bookings count even if refunded." error={state.fieldErrors?.maxUses}>
      <TextInput name="maxUses" type="number" inputMode="numeric" min={1} max={2_147_483_647} step={1} placeholder="Unlimited" defaultValue={promo?.maxUses ?? ""} />
    </Field>
    {link && <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
      <Field label="Booking link" className="min-w-0 flex-1">
        <TextInput value={link} readOnly onFocus={event => event.currentTarget.select()} />
      </Field>
      <Button type="button" variant="secondary" onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopyStatus("Link copied.");
        } catch {
          setCopyStatus("Select the link and copy it manually.");
        }
      }}>Copy link</Button>
      <span role="status" className="text-sm">{copyStatus}</span>
    </div>}
    <FormNotice tone={state.ok ? "success" : "error"} className="sm:col-span-2">{state.message}</FormNotice>
    <div className="sm:col-span-2"><Button type="submit" disabled={pending}>{promo ? "Save promo code" : "Create promo code"}</Button></div>
  </form>;
}
