import { and, eq, inArray } from "drizzle-orm";
import { bookings, categories, classMedia, classSourceReferences, classes, presenters, sourceReferences, type CountryCode } from "@/db/schema";
import { getCountryConfig } from "@/lib/domain/countries";
import { getDb } from "@/lib/db";
import { makePublicBookingReference, slugify } from "@/lib/utils";
import { getServerEnv } from "@/lib/env";
import { queueEmail } from "@/server/email/service";

export async function saveCategory(input: {
  id?: string;
  country: CountryCode;
  name: string;
  slug: string;
  shortDescription?: string;
  visibility: "VISIBLE" | "HIDDEN";
  isActive: boolean;
  sortOrder: number;
}) {
  const db = getDb();
  const data = {
    country: input.country,
    name: input.name,
    slug: slugify(input.slug),
    shortDescription: input.shortDescription || null,
    visibility: input.visibility,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    updatedAt: new Date(),
  } as const;
  if (input.id) {
    const [current] = await db.select({ country: categories.country }).from(categories).where(eq(categories.id, input.id)).limit(1);
    if (!current) throw new Error("Category not found.");
    if (current.country !== input.country) {
      const attached = await db.select({ id: classes.id }).from(classes).where(eq(classes.categoryId, input.id)).limit(1);
      if (attached.length) throw new Error("This category is already used by classes. Archive it or create a new country-specific category instead of changing its country.");
    }
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, input.id)).returning();
    if (!updated) throw new Error("Category not found.");
    return updated;
  }
  const [created] = await db.insert(categories).values(data).returning();
  return created;
}

export async function archiveCategory(id: string) {
  const [updated] = await getDb().update(categories).set({ isActive: false, visibility: "HIDDEN", archivedAt: new Date(), updatedAt: new Date() }).where(eq(categories.id, id)).returning();
  if (!updated) throw new Error("Category not found.");
  return updated;
}

export async function savePresenter(input: {
  id?: string;
  slug: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  bio: string;
  expertise?: string;
}) {
  const expertise = [...new Set((input.expertise ?? "").split(",").map((item) => item.trim()).filter(Boolean))];
  const data = {
    slug: slugify(input.slug),
    name: input.name,
    role: input.role,
    location: input.location,
    initials: input.initials.toUpperCase(),
    bio: input.bio,
    expertise,
    updatedAt: new Date(),
  } as const;
  const db = getDb();
  if (input.id) {
    const [updated] = await db.update(presenters).set(data).where(eq(presenters.id, input.id)).returning();
    if (!updated) throw new Error("Presenter not found.");
    return updated;
  }
  const [created] = await db.insert(presenters).values(data).returning();
  return created;
}

export async function archivePresenter(id: string) {
  const [updated] = await getDb().update(presenters).set({ isActive: false, archivedAt: new Date(), updatedAt: new Date() }).where(eq(presenters.id, id)).returning();
  if (!updated) throw new Error("Presenter not found.");
  return updated;
}

export async function saveSourceReference(input: {
  id?: string;
  authority: string;
  title: string;
  url: string;
  jurisdiction: CountryCode;
  checkedAt: Date;
  notes?: string;
}) {
  const data = { authority: input.authority, title: input.title, url: input.url, jurisdiction: input.jurisdiction, checkedAt: input.checkedAt, notes: input.notes || null, updatedAt: new Date() } as const;
  if (input.id) {
    const [current] = await getDb().select({ jurisdiction: sourceReferences.jurisdiction }).from(sourceReferences).where(eq(sourceReferences.id, input.id)).limit(1);
    if (!current) throw new Error("Source reference not found.");
    if (current.jurisdiction !== input.jurisdiction) {
      const attached = await getDb().select({ classId: classSourceReferences.classId }).from(classSourceReferences).where(eq(classSourceReferences.sourceReferenceId, input.id)).limit(1);
      if (attached.length) throw new Error("Change the jurisdiction only after detaching this source from its classes.");
    }
    const [updated] = await getDb().update(sourceReferences).set(data).where(eq(sourceReferences.id, input.id)).returning();
    if (!updated) throw new Error("Source reference not found.");
    return updated;
  }
  const [created] = await getDb().insert(sourceReferences).values(data).returning();
  return created;
}

export async function saveClass(input: {
  id?: string;
  title: string;
  slug: string;
  country: CountryCode;
  categoryId: string;
  presenterId?: string;
  shortDescription: string;
  fullDescription: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  bookingOpensAt: Date;
  bookingClosesAt: Date;
  deliveryFormat: "ONLINE" | "IN_PERSON" | "HYBRID";
  venueName?: string;
  venueAddress?: string;
  onlineAttendanceInfo?: string;
  priceMinorUnits: number;
  currency: "AUD" | "NZD";
  seatCapacity?: number | string;
  unlimitedCapacity: boolean;
  cpdUnitType: "POINTS" | "HOURS" | "NONE" | "CUSTOM";
  cpdUnitAmount?: number | string;
  cpdActivityCategory?: string;
  professionalIdentifierRequired: boolean;
  mediaAltText?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const db = getDb();
  const category = await db.select({ country: categories.country }).from(categories).where(eq(categories.id, input.categoryId)).limit(1);
  if (!category[0] || category[0].country !== input.country) throw new Error("Choose a category from the selected country.");
  if (input.presenterId) {
    const presenter = await db.select({ id: presenters.id }).from(presenters).where(eq(presenters.id, input.presenterId)).limit(1);
    if (!presenter[0]) throw new Error("Choose a valid presenter.");
  }
  const data = {
    title: input.title,
    slug: slugify(input.slug),
    country: input.country,
    categoryId: input.categoryId,
    presenterId: input.presenterId || null,
    shortDescription: input.shortDescription,
    fullDescription: input.fullDescription,
    startAt: input.startAt,
    endAt: input.endAt,
    timezone: input.timezone,
    bookingOpensAt: input.bookingOpensAt,
    bookingClosesAt: input.bookingClosesAt,
    deliveryFormat: input.deliveryFormat,
    venueName: input.venueName || null,
    venueAddress: input.venueAddress || null,
    onlineAttendanceInfo: input.onlineAttendanceInfo || null,
    priceMinorUnits: input.priceMinorUnits,
    currency: input.currency,
    seatCapacity: input.unlimitedCapacity ? null : Number(input.seatCapacity),
    unlimitedCapacity: input.unlimitedCapacity,
    cpdUnitType: input.cpdUnitType,
    cpdUnitAmount: input.cpdUnitType === "NONE" ? null : String(input.cpdUnitAmount),
    cpdActivityCategory: input.cpdActivityCategory || null,
    professionalIdentifierRequired: input.professionalIdentifierRequired,
    mediaAltText: input.mediaAltText || null,
    seoTitle: input.seoTitle || null,
    seoDescription: input.seoDescription || null,
    updatedAt: new Date(),
  } as const;
  if (input.id) {
    const [current] = await db.select({ country: classes.country, currency: classes.currency }).from(classes).where(eq(classes.id, input.id)).limit(1);
    if (!current) throw new Error("Class not found.");
    if (current.country !== input.country || current.currency !== input.currency) {
      const attachedBookings = await db.select({ id: bookings.id }).from(bookings).where(eq(bookings.classId, input.id)).limit(1);
      if (attachedBookings.length) throw new Error("Country or currency cannot change after bookings exist. Duplicate the class for a new jurisdiction or currency.");
    }
    const [updated] = await db.update(classes).set(data).where(eq(classes.id, input.id)).returning();
    if (!updated) throw new Error("Class not found.");
    return updated;
  }
  const [created] = await db.insert(classes).values({ ...data, status: "DRAFT" }).returning();
  return created;
}

export async function duplicateClass(id: string) {
  const db = getDb();
  const [source] = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  if (!source) throw new Error("Class not found.");
  const [copy] = await db.insert(classes).values({
    title: `${source.title} — Copy`,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    country: source.country,
    categoryId: source.categoryId,
    presenterId: source.presenterId,
    shortDescription: source.shortDescription,
    fullDescription: source.fullDescription,
    startAt: source.startAt,
    endAt: source.endAt,
    timezone: source.timezone,
    bookingOpensAt: source.bookingOpensAt,
    bookingClosesAt: source.bookingClosesAt,
    deliveryFormat: source.deliveryFormat,
    venueName: source.venueName,
    venueAddress: source.venueAddress,
    onlineAttendanceInfo: source.onlineAttendanceInfo,
    priceMinorUnits: source.priceMinorUnits,
    currency: source.currency,
    seatCapacity: source.seatCapacity,
    unlimitedCapacity: source.unlimitedCapacity,
    cpdUnitType: source.cpdUnitType,
    cpdUnitAmount: source.cpdUnitAmount,
    cpdActivityCategory: source.cpdActivityCategory,
    professionalIdentifierRequired: source.professionalIdentifierRequired,
    mediaAltText: source.mediaAltText,
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
    status: "DRAFT",
  }).returning();
  if (copy) {
    const sourceLinks = await db.select({ sourceReferenceId: classSourceReferences.sourceReferenceId }).from(classSourceReferences).where(eq(classSourceReferences.classId, id));
    if (sourceLinks.length) await db.insert(classSourceReferences).values(sourceLinks.map((link) => ({ classId: copy.id, sourceReferenceId: link.sourceReferenceId })));
    const sourceMedia = await db.select().from(classMedia).where(eq(classMedia.classId, id));
    if (sourceMedia.length) await db.insert(classMedia).values(sourceMedia.map((media) => ({ classId: copy.id, objectKey: media.objectKey, originalFilename: media.originalFilename, mimeType: media.mimeType, byteSize: media.byteSize, altText: media.altText, isPrimary: media.isPrimary })));
  }
  return copy;
}

export async function publishClass(id: string) {
  const [record] = await getDb().select().from(classes).where(eq(classes.id, id)).limit(1);
  if (!record) throw new Error("Class not found.");
  if (["CANCELLED", "COMPLETED", "ARCHIVED"].includes(record.status)) throw new Error("This class cannot be published from its current lifecycle state.");
  const country = getCountryConfig(record.country);
  const [category] = await getDb().select({ country: categories.country, isActive: categories.isActive, visibility: categories.visibility }).from(categories).where(eq(categories.id, record.categoryId)).limit(1);
  if (!category || category.country !== record.country || !category.isActive || category.visibility !== "VISIBLE") throw new Error("Choose an active, visible category from the class country before publishing.");
  if (record.currency !== country.currency) throw new Error(`The ${country.name} class must use ${country.currency} before it can be published.`);
  if (!record.shortDescription || !record.fullDescription || !record.categoryId || !record.timezone) throw new Error("Complete the required class information before publishing.");
  if (record.deliveryFormat !== "ONLINE" && (!record.venueName || !record.venueAddress)) throw new Error("Add the venue details before publishing an in-person or hybrid class.");
  if (record.deliveryFormat !== "IN_PERSON" && !record.onlineAttendanceInfo) throw new Error("Add online attendance information before publishing this class.");
  const [updated] = await getDb().update(classes).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(classes.id, id)).returning();
  return updated;
}

export async function unpublishClass(id: string) {
  const [current] = await getDb().select({ status: classes.status }).from(classes).where(eq(classes.id, id)).limit(1);
  if (!current) throw new Error("Class not found.");
  if (["CANCELLED", "COMPLETED", "ARCHIVED"].includes(current.status)) throw new Error("This class cannot be unpublished from its current lifecycle state.");
  const [updated] = await getDb().update(classes).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(classes.id, id)).returning();
  if (!updated) throw new Error("Class not found.");
  return updated;
}

export async function cancelClass(id: string) {
  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(classes).where(eq(classes.id, id)).for("update").limit(1);
    if (!current) throw new Error("Class not found.");
    if (["CANCELLED", "COMPLETED", "ARCHIVED"].includes(current.status)) throw new Error("This class cannot be cancelled from its current lifecycle state.");
    const [updated] = await tx.update(classes).set({ status: "CANCELLED", updatedAt: new Date() }).where(eq(classes.id, id)).returning();
    if (!updated) throw new Error("Class not found.");
    const affected = await tx.select({ id: bookings.id, userId: bookings.userId, email: bookings.email, fullName: bookings.fullName, classTitle: bookings.classTitleSnapshot }).from(bookings).where(and(eq(bookings.classId, id), inArray(bookings.status, ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "CONFIRMED", "PARTIALLY_REFUNDED"] as const)));
    return { classRecord: updated, affected };
  });
  const env = getServerEnv();
  for (const booking of result.affected) {
    try {
      await queueEmail({ type: "BOOKING_CANCELLED", email: booking.email, name: booking.fullName, bookingReference: makePublicBookingReference(booking.id), classTitle: booking.classTitle, reason: "The class has been cancelled. Any payment or refund handling is a separate operational action.", detailUrl: booking.userId ? `${env.APP_URL}/account/bookings/${booking.id}` : `${env.APP_URL}/classes/${result.classRecord.slug}` }, `class-cancelled:${id}:${booking.id}`);
    } catch (error) {
      console.error("[class-cancellation-email]", { classId: id, bookingId: booking.id, errorCategory: error instanceof Error ? error.name : "unknown" });
    }
  }
  return result.classRecord;
}

export async function archiveClass(id: string) {
  const [updated] = await getDb().update(classes).set({ status: "ARCHIVED", archivedAt: new Date(), updatedAt: new Date() }).where(eq(classes.id, id)).returning();
  if (!updated) throw new Error("Class not found.");
  return updated;
}

export async function updatePrimaryMedia(classId: string, media: { objectKey: string; originalFilename: string; mimeType: string; byteSize: number; altText: string }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [classRecord] = await tx.select({ id: classes.id }).from(classes).where(eq(classes.id, classId)).for("update").limit(1);
    if (!classRecord) throw new Error("Class not found.");
    await tx.update(classMedia).set({ isPrimary: false, updatedAt: new Date() }).where(eq(classMedia.classId, classId));
    const [created] = await tx.insert(classMedia).values({ classId, ...media, isPrimary: true }).returning();
    return created;
  });
}

export async function replaceClassSources(classId: string, sourceIds: string[]) {
  const db = getDb();
  const uniqueSourceIds = [...new Set(sourceIds)];
  await db.transaction(async (tx) => {
    const [classRecord] = await tx.select({ country: classes.country }).from(classes).where(eq(classes.id, classId)).limit(1);
    if (!classRecord) throw new Error("Class not found.");
    if (uniqueSourceIds.length) {
      const sources = await tx.select({ id: sourceReferences.id, jurisdiction: sourceReferences.jurisdiction }).from(sourceReferences).where(inArray(sourceReferences.id, uniqueSourceIds));
      if (sources.length !== uniqueSourceIds.length || sources.some((source) => source.jurisdiction !== classRecord.country)) throw new Error("Source references must match the class country.");
    }
    await tx.delete(classSourceReferences).where(eq(classSourceReferences.classId, classId));
    if (uniqueSourceIds.length) await tx.insert(classSourceReferences).values(uniqueSourceIds.map((sourceReferenceId) => ({ classId, sourceReferenceId })));
  });
}
