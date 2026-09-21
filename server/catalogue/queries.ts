import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import { auditLogs, bookings, categories, classMedia, classes, countries, payments, presenters, refunds, sourceReferences, classSourceReferences, type CountryCode, user } from "@/db/schema";
import { getDb } from "@/lib/db";
import { uuidSchema } from "@/lib/validation";

const activeBookingStatuses = ["CONFIRMED", "PARTIALLY_REFUNDED"] as const;
const reservingBookingStatuses = ["PENDING_PAYMENT", "PAYMENT_PROCESSING"] as const;

function activeSeatCounts() {
  return getDb()
    .select({
      classId: bookings.classId,
      count: sql<number>`count(*)::int`.as("active_count"),
    })
    .from(bookings)
    .where(
      or(
        inArray(bookings.status, activeBookingStatuses),
        inArray(bookings.status, reservingBookingStatuses),
      ),
    )
    .groupBy(bookings.classId)
    .as("active_seat_counts");
}

export type PublicClass = Awaited<ReturnType<typeof getPublishedClassBySlug>>;

export async function getPublishedClasses(filters: {
  country?: CountryCode;
  categorySlug?: string;
  deliveryFormat?: "ONLINE" | "IN_PERSON" | "HYBRID";
  time?: "upcoming" | "past";
  search?: string;
  presenterSlug?: string;
  activityType?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = getDb();
  const now = new Date();
  const counts = activeSeatCounts();
  const pageSize = Math.min(filters.pageSize ?? 12, 50);
  const page = Math.min(Math.max(filters.page ?? 1, 1), 10_000);
  const conditions = [inArray(classes.status, ["PUBLISHED", "SOLD_OUT"] as const), eq(categories.isActive, true), eq(categories.visibility, "VISIBLE")];
  if (filters.country) conditions.push(eq(classes.country, filters.country));
  if (filters.categorySlug) conditions.push(eq(categories.slug, filters.categorySlug));
  if (filters.deliveryFormat) conditions.push(eq(classes.deliveryFormat, filters.deliveryFormat));
  if (filters.time === "past") conditions.push(lt(classes.endAt, now));
  else conditions.push(gte(classes.endAt, now));
  if (filters.search) conditions.push(ilike(classes.title, `%${filters.search.replace(/[%_]/g, "\\$&")}%`));
  if (filters.presenterSlug) conditions.push(eq(presenters.slug, filters.presenterSlug));
  if (filters.activityType) conditions.push(eq(classes.cpdActivityCategory, filters.activityType));

  const rows = await db
    .select({
      class: classes,
      categoryName: categories.name,
      categorySlug: categories.slug,
      presenterName: presenters.name,
      presenterSlug: presenters.slug,
      activeBookingCount: sql<number>`coalesce(${counts.count}, 0)`.as("active_booking_count"),
    })
    .from(classes)
    .innerJoin(categories, eq(classes.categoryId, categories.id))
    .leftJoin(presenters, eq(classes.presenterId, presenters.id))
    .leftJoin(counts, eq(classes.id, counts.classId))
    .where(and(...conditions))
    .orderBy(asc(classes.startAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return rows.map((row) => ({
    ...row.class,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    presenterName: row.presenterName,
    presenterSlug: row.presenterSlug,
    activeBookingCount: Number(row.activeBookingCount ?? 0),
    remainingSeats: row.class.unlimitedCapacity ? null : Math.max((row.class.seatCapacity ?? 0) - Number(row.activeBookingCount ?? 0), 0),
  }));
}

export async function getPublishedClassBySlug(slug: string) {
  const now = new Date();
  const counts = activeSeatCounts();
  const [row] = await getDb()
    .select({
      class: classes,
      categoryName: categories.name,
      categorySlug: categories.slug,
      countryName: countries.name,
      presenterName: presenters.name,
      presenterSlug: presenters.slug,
      presenterRole: presenters.role,
      presenterLocation: presenters.location,
      presenterInitials: presenters.initials,
      presenterBio: presenters.bio,
      presenterExpertise: presenters.expertise,
      activeBookingCount: sql<number>`coalesce(${counts.count}, 0)`.as("active_booking_count"),
      mediaKey: classMedia.objectKey,
    })
    .from(classes)
    .innerJoin(categories, eq(classes.categoryId, categories.id))
    .innerJoin(countries, eq(classes.country, countries.code))
    .leftJoin(presenters, eq(classes.presenterId, presenters.id))
    .leftJoin(counts, eq(classes.id, counts.classId))
    .leftJoin(classMedia, and(eq(classes.id, classMedia.classId), eq(classMedia.isPrimary, true)))
    .where(and(eq(classes.slug, slug), inArray(classes.status, ["PUBLISHED", "SOLD_OUT"] as const), eq(categories.isActive, true), eq(categories.visibility, "VISIBLE")))
    .limit(1);

  if (!row) return null;
  const remainingSeats = row.class.unlimitedCapacity ? null : Math.max((row.class.seatCapacity ?? 0) - Number(row.activeBookingCount ?? 0), 0);
  const isBookingOpen = now >= row.class.bookingOpensAt && now <= row.class.bookingClosesAt && now < row.class.startAt && row.class.status !== "CANCELLED" && (remainingSeats === null || remainingSeats > 0);
  return {
    ...row.class,
    categoryName: row.categoryName,
    categorySlug: row.categorySlug,
    countryName: row.countryName,
    presenterName: row.presenterName,
    presenterSlug: row.presenterSlug,
    presenterRole: row.presenterRole,
    presenterLocation: row.presenterLocation,
    presenterInitials: row.presenterInitials,
    presenterBio: row.presenterBio,
    presenterExpertise: row.presenterExpertise,
    activeBookingCount: Number(row.activeBookingCount ?? 0),
    remainingSeats,
    mediaKey: row.mediaKey,
    isBookingOpen,
  };
}

export async function getPublishedActivityTypes(country?: CountryCode) {
  const conditions = [
    inArray(classes.status, ["PUBLISHED", "SOLD_OUT"] as const),
    eq(categories.isActive, true),
    eq(categories.visibility, "VISIBLE"),
    isNotNull(classes.cpdActivityCategory),
  ];
  if (country) conditions.push(eq(classes.country, country));
  const rows = await getDb()
    .select({ value: classes.cpdActivityCategory, count: sql<number>`count(*)::int` })
    .from(classes)
    .innerJoin(categories, eq(classes.categoryId, categories.id))
    .where(and(...conditions))
    .groupBy(classes.cpdActivityCategory)
    .orderBy(asc(classes.cpdActivityCategory));

  return rows.flatMap((row) => row.value ? [{ value: row.value, count: Number(row.count) }] : []);
}

export async function getClassSourceReferences(classId: string) {
  return getDb()
    .select({ source: sourceReferences })
    .from(classSourceReferences)
    .innerJoin(sourceReferences, eq(classSourceReferences.sourceReferenceId, sourceReferences.id))
    .where(eq(classSourceReferences.classId, classId))
    .orderBy(desc(sourceReferences.checkedAt));
}

export async function getPublicSourceReferences(jurisdiction?: CountryCode) {
  const condition = jurisdiction ? eq(sourceReferences.jurisdiction, jurisdiction) : undefined;
  return getDb()
    .select()
    .from(sourceReferences)
    .where(condition)
    .orderBy(desc(sourceReferences.checkedAt), asc(sourceReferences.authority), asc(sourceReferences.title));
}

export async function getAdminSourceReferences(jurisdiction?: CountryCode) {
  const condition = jurisdiction ? eq(sourceReferences.jurisdiction, jurisdiction) : undefined;
  return getDb().select().from(sourceReferences).where(condition).orderBy(desc(sourceReferences.checkedAt), asc(sourceReferences.authority), asc(sourceReferences.title));
}

export async function getCategories(country?: CountryCode, includeArchived = false) {
  const conditions = includeArchived ? [] : [eq(categories.isActive, true), eq(categories.visibility, "VISIBLE")];
  if (country) conditions.push(eq(categories.country, country));
  return getDb().select().from(categories).where(and(...conditions)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getPresenters(includeArchived = false) {
  const condition = includeArchived ? undefined : eq(presenters.isActive, true);
  return getDb().select().from(presenters).where(condition).orderBy(asc(presenters.name));
}

export async function getPresenterBySlug(slug: string) {
  const [row] = await getDb().select().from(presenters).where(and(eq(presenters.slug, slug), eq(presenters.isActive, true))).limit(1);
  return row ?? null;
}

export async function getCountries() {
  return getDb().select().from(countries).where(eq(countries.isActive, true)).orderBy(asc(countries.name));
}

export async function getAdminCategories() {
  return getDb()
    .select({ category: categories, countryName: countries.name, classCount: sql<number>`count(${classes.id})::int` })
    .from(categories)
    .innerJoin(countries, eq(categories.country, countries.code))
    .leftJoin(classes, eq(classes.categoryId, categories.id))
    .groupBy(categories.id, countries.name)
    .orderBy(asc(categories.country), asc(categories.sortOrder), asc(categories.name));
}

export async function getAdminPresenters() {
  return getDb()
    .select({ presenter: presenters, classCount: sql<number>`count(${classes.id})::int` })
    .from(presenters)
    .leftJoin(classes, eq(classes.presenterId, presenters.id))
    .groupBy(presenters.id)
    .orderBy(asc(presenters.isActive), asc(presenters.name));
}

export async function getAdminClasses(filters?: { search?: string; status?: string; country?: CountryCode; page?: number; pageSize?: number }) {
  const page = Math.min(Math.max(filters?.page ?? 1, 1), 10_000);
  const pageSize = Math.min(filters?.pageSize ?? 20, 100);
  const conditions = [] as ReturnType<typeof eq>[];
  if (filters?.search) conditions.push(ilike(classes.title, `%${filters.search.replace(/[%_]/g, "\\$&")}%`));
  if (filters?.status && ["DRAFT", "SCHEDULED", "PUBLISHED", "SOLD_OUT", "CANCELLED", "COMPLETED", "ARCHIVED"].includes(filters.status)) conditions.push(eq(classes.status, filters.status as never));
  if (filters?.country) conditions.push(eq(classes.country, filters.country));
  return getDb()
    .select({ class: classes, categoryName: categories.name, presenterName: presenters.name })
    .from(classes)
    .innerJoin(categories, eq(classes.categoryId, categories.id))
    .leftJoin(presenters, eq(classes.presenterId, presenters.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(classes.startAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function getAdminClassById(id: string) {
  const [row] = await getDb().select({ class: classes, categoryName: categories.name, presenterName: presenters.name }).from(classes).innerJoin(categories, eq(classes.categoryId, categories.id)).leftJoin(presenters, eq(classes.presenterId, presenters.id)).where(eq(classes.id, id)).limit(1);
  return row ?? null;
}

export async function getAdminStats() {
  const db = getDb();
  const [classStats] = await db.select({ total: sql<number>`count(*)::int`, upcoming: sql<number>`count(*) filter (where ${classes.startAt} >= now() and ${classes.status} in ('PUBLISHED', 'SOLD_OUT'))::int`, soldOut: sql<number>`count(*) filter (where ${classes.status} = 'SOLD_OUT')::int` }).from(classes);
  const [bookingStats] = await db.select({ pending: sql<number>`count(*) filter (where ${bookings.status} in ('PENDING_PAYMENT', 'PAYMENT_PROCESSING'))::int`, confirmed: sql<number>`count(*) filter (where ${bookings.status} in ('CONFIRMED', 'PARTIALLY_REFUNDED'))::int`, refunded: sql<number>`count(*) filter (where ${bookings.status} = 'REFUNDED')::int` }).from(bookings);
  return { classes: classStats, bookings: bookingStats };
}

export async function getAdminBookingRows(filters?: { search?: string; status?: string; classId?: string; page?: number; pageSize?: number }) {
  const page = Math.min(Math.max(filters?.page ?? 1, 1), 10_000);
  const pageSize = Math.min(filters?.pageSize ?? 25, 100);
  const conditions = [] as ReturnType<typeof eq>[];
  if (filters?.search) conditions.push(or(ilike(bookings.email, `%${filters.search.replace(/[%_]/g, "\\$&")}%`), ilike(bookings.fullName, `%${filters.search.replace(/[%_]/g, "\\$&")}%`)) as never);
  if (filters?.status && ["PENDING_PAYMENT", "PAYMENT_PROCESSING", "CONFIRMED", "PAYMENT_FAILED", "CANCELLED", "PARTIALLY_REFUNDED", "REFUNDED", "EXPIRED"].includes(filters.status)) conditions.push(eq(bookings.status, filters.status as never));
  if (filters?.classId && uuidSchema.safeParse(filters.classId).success) conditions.push(eq(bookings.classId, filters.classId));
  return getDb().select({ booking: bookings, classTitle: classes.title }).from(bookings).innerJoin(classes, eq(bookings.classId, classes.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(bookings.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
}

export async function getAdminBookingById(id: string) {
  const [row] = await getDb().select({ booking: bookings, classTitle: classes.title, classSlug: classes.slug, payment: payments }).from(bookings).innerJoin(classes, eq(bookings.classId, classes.id)).leftJoin(payments, eq(bookings.id, payments.bookingId)).where(eq(bookings.id, id)).limit(1);
  return row ?? null;
}

export async function getCustomerBookings(userId: string) {
  return getDb().select({ booking: bookings, classTitle: classes.title, classSlug: classes.slug, startAt: classes.startAt, endAt: classes.endAt, timezone: classes.timezone, deliveryFormat: classes.deliveryFormat, venueName: classes.venueName, onlineAttendanceInfo: classes.onlineAttendanceInfo, categoryName: categories.name }).from(bookings).innerJoin(classes, eq(bookings.classId, classes.id)).innerJoin(categories, eq(classes.categoryId, categories.id)).where(eq(bookings.userId, userId)).orderBy(desc(classes.startAt));
}

export async function getCustomerBookingById(userId: string, bookingId: string) {
  const [row] = await getDb().select({ booking: bookings, classTitle: classes.title, classSlug: classes.slug, startAt: classes.startAt, endAt: classes.endAt, timezone: classes.timezone, deliveryFormat: classes.deliveryFormat, venueName: classes.venueName, onlineAttendanceInfo: classes.onlineAttendanceInfo, categoryName: categories.name }).from(bookings).innerJoin(classes, eq(bookings.classId, classes.id)).innerJoin(categories, eq(classes.categoryId, categories.id)).where(and(eq(bookings.id, bookingId), eq(bookings.userId, userId))).limit(1);
  return row ?? null;
}

export async function getAdminCustomerRows(search?: string, page = 1, pageSize = 25) {
  const conditions = [eq(user.role, "CUSTOMER")];
  if (search) conditions.push(ilike(user.email, `%${search.replace(/[%_]/g, "\\$&")}%`) as never);
  const safePage = Math.min(Math.max(page, 1), 10_000);
  const safePageSize = Math.min(pageSize, 100);
  return getDb().select({ id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt, bookingCount: sql<number>`count(${bookings.id})::int` }).from(user).leftJoin(bookings, eq(bookings.userId, user.id)).where(and(...conditions)).groupBy(user.id).orderBy(desc(user.createdAt)).limit(safePageSize).offset((safePage - 1) * safePageSize);
}

export async function getAdminPaymentRows(filters?: { search?: string; status?: string; page?: number; pageSize?: number }) {
  const safePage = Math.min(Math.max(filters?.page ?? 1, 1), 10_000);
  const safePageSize = Math.min(filters?.pageSize ?? 50, 100);
  const conditions = [] as ReturnType<typeof eq>[];
  if (filters?.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(bookings.email, pattern), ilike(bookings.fullName, pattern), ilike(classes.title, pattern)) as never);
  }
  if (filters?.status && ["PENDING", "PROCESSING", "SUCCEEDED", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"].includes(filters.status)) conditions.push(eq(payments.status, filters.status as never));
  return getDb().select({ payment: payments, bookingReference: bookings.id, attendee: bookings.fullName, classTitle: classes.title }).from(payments).innerJoin(bookings, eq(payments.bookingId, bookings.id)).innerJoin(classes, eq(bookings.classId, classes.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(payments.createdAt)).limit(safePageSize).offset((safePage - 1) * safePageSize);
}

export async function getAdminRefundRows(filters?: { search?: string; status?: string; page?: number; pageSize?: number }) {
  const safePage = Math.min(Math.max(filters?.page ?? 1, 1), 10_000);
  const safePageSize = Math.min(filters?.pageSize ?? 50, 100);
  const conditions = [] as ReturnType<typeof eq>[];
  if (filters?.search) {
    const pattern = `%${filters.search.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(bookings.email, pattern), ilike(bookings.fullName, pattern), ilike(classes.title, pattern), ilike(refunds.reason, pattern)) as never);
  }
  if (filters?.status && ["PENDING", "SUCCEEDED", "FAILED", "REQUIRES_ACTION", "CANCELLED"].includes(filters.status)) conditions.push(eq(refunds.status, filters.status as never));
  return getDb().select({ refund: refunds, bookingReference: bookings.id, attendee: bookings.fullName, classTitle: classes.title }).from(refunds).innerJoin(bookings, eq(refunds.bookingId, bookings.id)).innerJoin(classes, eq(bookings.classId, classes.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(refunds.createdAt)).limit(safePageSize).offset((safePage - 1) * safePageSize);
}

export async function getAuditLogRows() {
  return getDb().select({ audit: auditLogs, actorName: user.name, actorEmail: user.email }).from(auditLogs).leftJoin(user, eq(auditLogs.actorUserId, user.id)).orderBy(desc(auditLogs.createdAt)).limit(200);
}
