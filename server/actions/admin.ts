"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/server/auth/session";
import { writeAuditLog } from "@/server/audit";
import { safeErrorMessage } from "@/lib/utils";
import { parseLocalDateTime } from "@/lib/date";
import { categoryFormSchema, classFormSchema, countryCodeSchema, presenterFormSchema, refundFormSchema, sourceReferenceFormSchema, toFormObject, uuidSchema } from "@/lib/validation";
import { saveCategory, archiveCategory, saveClass, duplicateClass, publishClass, unpublishClass, cancelClass, archiveClass, savePresenter, archivePresenter, saveSourceReference, replaceClassSources } from "@/server/catalogue/service";
import { cancelBookingByAdmin } from "@/server/bookings/service";
import { createAdminRefund } from "@/server/payments/refunds";
import { getDb } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { categories } from "@/db/schema";

export type AdminActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string>; id?: string };

function fieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): Record<string, string> {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export async function saveCategoryAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const parsed = categoryFormSchema.safeParse(toFormObject(formData));
  if (!parsed.success) return { ok: false, message: "Review the category fields.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const category = await saveCategory({ ...parsed.data, id: parsed.data.id || undefined, isActive: parsed.data.isActive === "true" });
    await writeAuditLog({ actorUserId: session.user.id, action: parsed.data.id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED", entityType: "category", entityId: category.id, metadata: { country: category.country, name: category.name } });
    revalidatePath("/admin/categories");
    revalidatePath("/classes");
    return { ok: true, message: parsed.data.id ? "Category updated." : "Category created.", id: category.id };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Category could not be saved. Check that its slug is unique.") };
  }
}

export async function archiveCategoryAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Category id is invalid." };
  try {
    const category = await archiveCategory(id);
    await writeAuditLog({ actorUserId: session.user.id, action: "CATEGORY_ARCHIVED", entityType: "category", entityId: category.id });
    revalidatePath("/admin/categories");
    return { ok: true, message: "Category archived." };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Category could not be archived.") };
  }
}

export async function savePresenterAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const parsed = presenterFormSchema.safeParse(toFormObject(formData));
  if (!parsed.success) return { ok: false, message: "Review the presenter fields.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const presenter = await savePresenter({ ...parsed.data, id: parsed.data.id || undefined, expertise: parsed.data.expertise || undefined });
    await writeAuditLog({ actorUserId: session.user.id, action: parsed.data.id ? "PRESENTER_UPDATED" : "PRESENTER_CREATED", entityType: "presenter", entityId: presenter.id, metadata: { slug: presenter.slug, name: presenter.name } });
    revalidatePath("/admin/presenters");
    revalidatePath("/presenters");
    revalidatePath(`/presenters/${presenter.slug}`);
    revalidatePath("/classes");
    return { ok: true, message: parsed.data.id ? "Presenter updated." : "Presenter created.", id: presenter.id };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Presenter could not be saved. Check that the slug is unique.") };
  }
}

export async function archivePresenterAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Presenter id is invalid." };
  try {
    const presenter = await archivePresenter(id);
    await writeAuditLog({ actorUserId: session.user.id, action: "PRESENTER_ARCHIVED", entityType: "presenter", entityId: presenter.id, metadata: { slug: presenter.slug, name: presenter.name } });
    revalidatePath("/admin/presenters");
    revalidatePath("/presenters");
    revalidatePath(`/presenters/${presenter.slug}`);
    return { ok: true, message: "Presenter archived." };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Presenter could not be archived.") };
  }
}

export async function saveSourceReferenceAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const parsed = sourceReferenceFormSchema.safeParse(toFormObject(formData));
  if (!parsed.success) return { ok: false, message: "Review the source reference fields.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const source = await saveSourceReference({ ...parsed.data, id: parsed.data.id || undefined, notes: parsed.data.notes || undefined });
    await writeAuditLog({ actorUserId: session.user.id, action: parsed.data.id ? "SOURCE_REFERENCE_UPDATED" : "SOURCE_REFERENCE_CREATED", entityType: "source_reference", entityId: source.id, metadata: { authority: source.authority, jurisdiction: source.jurisdiction } });
    revalidatePath("/admin/source-references");
    return { ok: true, message: parsed.data.id ? "Source reference updated." : "Source reference created.", id: source.id };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Source reference could not be saved.") };
  }
}

export async function saveClassSourcesAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const classId = String(formData.get("classId") ?? "");
  const rawSourceIds = formData.getAll("sourceIds").map((value) => String(value));
  if (rawSourceIds.some((sourceId) => !uuidSchema.safeParse(sourceId).success)) return { ok: false, message: "One or more source references are invalid." };
  const sourceIds = [...new Set(rawSourceIds)];
  if (!uuidSchema.safeParse(classId).success) return { ok: false, message: "Class id is required." };
  try {
    await replaceClassSources(classId, sourceIds);
    await writeAuditLog({ actorUserId: session.user.id, action: "CLASS_SOURCE_REFERENCES_UPDATED", entityType: "class", entityId: classId, metadata: { count: sourceIds.length } });
    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/classes");
    return { ok: true, message: "Source references updated." };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Source references could not be updated.") };
  }
}

export async function saveClassAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const raw = toFormObject(formData);
  const timezone = raw.timezone;
  try {
    const parsed = classFormSchema.safeParse({
      ...raw,
      startAt: parseLocalDateTime(raw.startAt, timezone),
      endAt: parseLocalDateTime(raw.endAt, timezone),
      bookingOpensAt: parseLocalDateTime(raw.bookingOpensAt, timezone),
      bookingClosesAt: parseLocalDateTime(raw.bookingClosesAt, timezone),
    });
    if (!parsed.success) return { ok: false, message: "Review the class fields.", fieldErrors: fieldErrors(parsed.error) };
    const classRecord = await saveClass({ ...parsed.data, id: parsed.data.id || undefined, unlimitedCapacity: parsed.data.unlimitedCapacity === "true", professionalIdentifierRequired: parsed.data.professionalIdentifierRequired === "true" });
    await writeAuditLog({ actorUserId: session.user.id, action: parsed.data.id ? "CLASS_UPDATED" : "CLASS_CREATED", entityType: "class", entityId: classRecord.id, metadata: { country: classRecord.country, title: classRecord.title } });
    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${classRecord.id}`);
    revalidatePath("/classes");
    return { ok: true, message: parsed.data.id ? "Class updated." : "Class saved as a draft.", id: classRecord.id };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Class could not be saved. Check the slug and category.") };
  }
}

async function classMutation(formData: FormData, operation: "publish" | "unpublish" | "duplicate" | "cancel" | "archive"): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const id = String(formData.get("id") ?? "");
  if (!uuidSchema.safeParse(id).success) return { ok: false, message: "Class id is invalid." };
  try {
    const record = operation === "publish" ? await publishClass(id) : operation === "unpublish" ? await unpublishClass(id) : operation === "duplicate" ? await duplicateClass(id) : operation === "cancel" ? await cancelClass(id) : await archiveClass(id);
    const auditAction = { publish: "CLASS_PUBLISHED", unpublish: "CLASS_UNPUBLISHED", duplicate: "CLASS_DUPLICATED", cancel: "CLASS_CANCELLED", archive: "CLASS_ARCHIVED" }[operation];
    await writeAuditLog({ actorUserId: session.user.id, action: auditAction, entityType: "class", entityId: record.id, metadata: { status: record.status } });
    revalidatePath("/admin/classes");
    revalidatePath(`/admin/classes/${id}`);
    revalidatePath("/classes");
    const message = operation === "duplicate" ? "Draft duplicated." : operation === "unpublish" ? "Class unpublished." : operation === "publish" ? "Class published." : operation === "cancel" ? "Class cancelled." : "Class archived.";
    return { ok: true, message, id: record.id };
  } catch (error) {
    const failureMessage = { publish: "Class could not be published.", unpublish: "Class could not be unpublished.", duplicate: "Class could not be duplicated.", cancel: "Class could not be cancelled.", archive: "Class could not be archived." }[operation];
    return { ok: false, message: safeErrorMessage(error, failureMessage) };
  }
}

export async function publishClassAction(formData: FormData): Promise<AdminActionState> { return classMutation(formData, "publish"); }
export async function unpublishClassAction(formData: FormData): Promise<AdminActionState> { return classMutation(formData, "unpublish"); }
export async function duplicateClassAction(formData: FormData): Promise<AdminActionState> { return classMutation(formData, "duplicate"); }
export async function cancelClassAction(formData: FormData): Promise<AdminActionState> { return classMutation(formData, "cancel"); }
export async function archiveClassAction(formData: FormData): Promise<AdminActionState> { return classMutation(formData, "archive"); }

export async function createRefundAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const parsed = refundFormSchema.safeParse(toFormObject(formData));
  if (!parsed.success) return { ok: false, message: "Review the refund details.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const refund = await createAdminRefund({ ...parsed.data, internalNote: parsed.data.internalNote || undefined, adminUserId: session.user.id });
    await writeAuditLog({ actorUserId: session.user.id, action: "REFUND_INITIATED", entityType: "refund", entityId: refund.id, metadata: { bookingId: refund.bookingId, amount: refund.amount, currency: refund.currency, reason: refund.reason } });
    revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
    revalidatePath("/admin/refunds");
    return { ok: true, message: "Refund request sent to Stripe." };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Refund could not be started.") };
  }
}

export async function cancelBookingByAdminAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const bookingId = String(formData.get("bookingId") ?? "");
  if (!uuidSchema.safeParse(bookingId).success) return { ok: false, message: "Booking id is invalid." };
  try {
    await cancelBookingByAdmin(bookingId);
    await writeAuditLog({ actorUserId: session.user.id, action: "BOOKING_CANCELLED", entityType: "booking", entityId: bookingId });
    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath(`/account/bookings/${bookingId}`);
    return { ok: true, message: "Booking cancelled. Any refund remains a separate action." };
  } catch (error) {
    return { ok: false, message: safeErrorMessage(error, "Booking could not be cancelled.") };
  }
}

export async function reorderCategoriesAction(formData: FormData): Promise<AdminActionState> {
  const session = await requireAdminSession();
  const country = countryCodeSchema.safeParse(String(formData.get("country") ?? ""));
  if (!country.success) return { ok: false, message: "Country is invalid." };
  const entries = [...new Set(String(formData.get("categories") ?? "").split(",").map((id) => id.trim()).filter(Boolean))];
  if (!entries.length || entries.some((id) => !uuidSchema.safeParse(id).success)) return { ok: false, message: "One or more category ids are invalid." };
  const db = getDb();
  const existing = await db.select({ id: categories.id, country: categories.country }).from(categories).where(inArray(categories.id, entries));
  if (existing.length !== entries.length || existing.some((category) => category.country !== country.data)) return { ok: false, message: "The category order does not match the selected country." };
  for (const [index, id] of entries.entries()) await db.update(categories).set({ sortOrder: index, updatedAt: new Date() }).where(eq(categories.id, id));
  await writeAuditLog({ actorUserId: session.user.id, action: "CATEGORIES_REORDERED", entityType: "category", entityId: country.data, metadata: { count: entries.length, country: country.data } });
  revalidatePath("/admin/categories");
  revalidatePath("/classes");
  revalidatePath(country.data === "AU" ? "/australia" : "/new-zealand");
  return { ok: true, message: "Category order saved." };
}
