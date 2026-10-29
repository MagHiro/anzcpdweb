"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth/session";
import { reconcileBookingPayment } from "@/server/payments/reconciliation";
import { uuidSchema } from "@/lib/validation";
import { safeErrorMessage } from "@/lib/utils";

export async function reconcilePaymentAction(_previous: { ok: boolean; message?: string }, formData: FormData) {
  const session = await requireAdminSession();
  const id = uuidSchema.safeParse(formData.get("bookingId"));
  if (!id.success) return { ok: false, message: "Booking reference is invalid." };
  try {
    const result = await reconcileBookingPayment(id.data, session.user.id);
    revalidatePath("/admin", "layout");
    revalidatePath("/account", "layout");
    return { ok: true, message: `Stripe checked: Checkout ${result.checkoutStatus}, payment ${result.paymentStatus}.` };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Reconciliation could not complete. No new payment or refund was requested.") };
  }
}
