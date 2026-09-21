"use server";

import { revalidatePath } from "next/cache";
import { requireCustomerSession } from "@/server/auth/session";
import { cancelPendingBooking } from "@/server/bookings/service";
import { publicErrorMessage } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export async function cancelPendingBookingAction(formData: FormData) {
  const session = await requireCustomerSession();
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!uuidSchema.safeParse(bookingId).success) return { ok: false, error: "Booking id is invalid." };
  try {
    await cancelPendingBooking(session.user.id, bookingId);
    revalidatePath("/account/bookings");
    revalidatePath(`/account/bookings/${bookingId}`);
    return { ok: true, message: "Booking cancelled." };
  } catch (error) {
    return { ok: false, error: publicErrorMessage(error, "Booking could not be cancelled. Check its current payment state and try again.") };
  }
}
