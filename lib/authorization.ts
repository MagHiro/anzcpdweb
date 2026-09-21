import type { UserRole } from "@/db/schema";

export function isAdmin(role: UserRole | string | null | undefined): boolean { return role === "ADMIN"; }
export function ownsBooking(userId: string | null | undefined, bookingOwnerId: string | null | undefined): boolean { return Boolean(userId && bookingOwnerId && userId === bookingOwnerId); }
