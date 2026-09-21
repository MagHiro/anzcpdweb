import { z } from "zod";
import type { CountryCode } from "@/db/schema";

export const countryCodeSchema = z.enum(["AU", "NZ"]);
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
export const nameSchema = z.string().trim().min(2, "Enter your full name.").max(120, "Name is too long.");
export const slugSchema = z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");

export function professionalIdentifierSchema(country: CountryCode, required: boolean) {
  const base = z.string().trim().max(64, "Identifier is too long.");
  if (!required) return base.optional().or(z.literal(""));
  if (country === "AU") return base.min(1, "Enter your MARN.").regex(/^\d{6}$/, "Enter the six-digit MARN format.");
  return base.min(1, "Enter your IAA licence number.").regex(/^[A-Za-z0-9][A-Za-z0-9 -]{3,31}$/, "Enter a valid IAA licence number format.");
}

export function toFormObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

export const bookingFormSchema = z
  .object({
    classSlug: slugSchema,
    fullName: nameSchema,
    email: emailSchema,
    emailConfirmation: emailSchema,
    professionalIdentifier: z.string().trim().max(64).optional().or(z.literal("")),
    createAccountRequested: z.enum(["on"]).optional(),
    termsAccepted: z.literal("on", "Accept the terms to continue."),
    refundPolicyAccepted: z.literal("on", "Acknowledge the refund policy to continue."),
    turnstileToken: z.string().trim().optional().or(z.literal("")),
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.email !== value.emailConfirmation) {
      context.addIssue({ code: "custom", path: ["emailConfirmation"], message: "Email addresses do not match." });
    }
  });

export const authRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  confirmPassword: z.string().min(1),
  turnstileToken: z.string().trim().optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
});

export const authLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  turnstileToken: z.string().trim().optional().or(z.literal("")),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().trim().optional().or(z.literal("")),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  confirmPassword: z.string().min(1),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
});

export const categoryFormSchema = z.object({
  id: uuidSchema.optional().or(z.literal("")),
  country: countryCodeSchema,
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  shortDescription: z.string().trim().max(280).optional().or(z.literal("")),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
  isActive: z.enum(["true", "false"]),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
});

export const presenterFormSchema = z.object({
  id: uuidSchema.optional().or(z.literal("")),
  slug: slugSchema,
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(180),
  location: z.string().trim().min(2).max(120),
  initials: z.string().trim().min(1).max(5).regex(/^[A-Za-z0-9]+$/, "Use letters or numbers only."),
  bio: z.string().trim().min(20).max(2_000),
  expertise: z.string().trim().max(500).optional().or(z.literal("")),
});

export const sourceReferenceFormSchema = z.object({
  id: uuidSchema.optional().or(z.literal("")),
  authority: z.string().trim().min(2).max(120),
  title: z.string().trim().min(3).max(240),
  url: z.string().trim().url("Enter a valid source URL.").max(2_000).refine((value) => { try { const protocol = new URL(value).protocol; return protocol === "https:" || protocol === "http:"; } catch { return false; } }, "Use an HTTP or HTTPS source URL."),
  jurisdiction: countryCodeSchema,
  checkedAt: z.coerce.date(),
  notes: z.string().trim().max(1_000).optional().or(z.literal("")),
});

export const classFormSchema = z.object({
  id: uuidSchema.optional().or(z.literal("")),
  title: z.string().trim().min(5).max(180),
  slug: slugSchema,
  country: countryCodeSchema,
  categoryId: uuidSchema,
  presenterId: uuidSchema.optional().or(z.literal("")),
  shortDescription: z.string().trim().min(10).max(400),
  fullDescription: z.string().trim().min(20).max(20_000),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  timezone: z.string().trim().min(3).max(64),
  bookingOpensAt: z.coerce.date(),
  bookingClosesAt: z.coerce.date(),
  deliveryFormat: z.enum(["ONLINE", "IN_PERSON", "HYBRID"]),
  venueName: z.string().trim().max(160).optional().or(z.literal("")),
  venueAddress: z.string().trim().max(500).optional().or(z.literal("")),
  onlineAttendanceInfo: z.string().trim().max(2_000).optional().or(z.literal("")),
  priceMinorUnits: z.coerce.number().int().min(0).max(10_000_000),
  currency: z.enum(["AUD", "NZD"]),
  seatCapacity: z.coerce.number().int().min(1).max(100_000).optional().or(z.literal("")),
  unlimitedCapacity: z.enum(["true", "false"]),
  cpdUnitType: z.enum(["POINTS", "HOURS", "NONE", "CUSTOM"]),
  cpdUnitAmount: z.coerce.number().min(0).max(10_000).optional().or(z.literal("")),
  cpdActivityCategory: z.string().trim().max(120).optional().or(z.literal("")),
  professionalIdentifierRequired: z.enum(["true", "false"]),
  mediaAltText: z.string().trim().max(240).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(180).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.endAt <= value.startAt) context.addIssue({ code: "custom", path: ["endAt"], message: "End time must be after start time." });
  if (value.bookingClosesAt < value.bookingOpensAt) context.addIssue({ code: "custom", path: ["bookingClosesAt"], message: "Booking close must be after booking open." });
  if (value.unlimitedCapacity === "false" && (value.seatCapacity === "" || value.seatCapacity === undefined)) context.addIssue({ code: "custom", path: ["seatCapacity"], message: "Enter a capacity or choose unlimited." });
  if (value.cpdUnitType !== "NONE" && (value.cpdUnitAmount === "" || value.cpdUnitAmount === undefined)) context.addIssue({ code: "custom", path: ["cpdUnitAmount"], message: "Enter the CPD amount." });
});

export const refundFormSchema = z.object({
  bookingId: uuidSchema,
  amount: z.coerce.number().int().positive("Refund amount must be greater than zero."),
  reason: z.string().trim().min(3).max(200),
  internalNote: z.string().trim().max(1_000).optional().or(z.literal("")),
  idempotencyKey: z.string().uuid(),
});

export const accountSetupSchema = z.object({
  token: z.string().min(20),
  name: nameSchema,
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  confirmPassword: z.string().min(1),
}).superRefine((value, context) => {
  if (value.password !== value.confirmPassword) context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
});

export const claimBookingsSchema = z.object({ token: z.string().min(20) });

export type BookingFormValues = z.infer<typeof bookingFormSchema>;
export type CountryValue = z.infer<typeof countryCodeSchema>;
