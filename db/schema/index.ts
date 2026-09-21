import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const countryCodeEnum = pgEnum("country_code", ["AU", "NZ"]);
export const userRoleEnum = pgEnum("user_role", ["CUSTOMER", "ADMIN"]);
export const categoryVisibilityEnum = pgEnum("category_visibility", ["VISIBLE", "HIDDEN"]);
export const classStatusEnum = pgEnum("class_status", [
  "DRAFT",
  "SCHEDULED",
  "PUBLISHED",
  "SOLD_OUT",
  "CANCELLED",
  "COMPLETED",
  "ARCHIVED",
]);
export const deliveryFormatEnum = pgEnum("delivery_format", ["ONLINE", "IN_PERSON", "HYBRID"]);
export const cpdUnitTypeEnum = pgEnum("cpd_unit_type", ["POINTS", "HOURS", "NONE", "CUSTOM"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING_PAYMENT",
  "PAYMENT_PROCESSING",
  "CONFIRMED",
  "PAYMENT_FAILED",
  "CANCELLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
  "EXPIRED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
]);
export const refundStatusEnum = pgEnum("refund_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REQUIRES_ACTION",
  "CANCELLED",
]);
export const tokenPurposeEnum = pgEnum("token_purpose", ["ACCOUNT_SETUP", "ACCOUNT_CLAIM", "GUEST_BOOKING_ACCESS"]);
export const outboxStatusEnum = pgEnum("outbox_status", ["PENDING", "PROCESSING", "SENT", "FAILED"]);

const createdUpdated = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/** Better Auth core tables. Column names intentionally follow Better Auth's PostgreSQL adapter. */
export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    role: userRoleEnum("role").notNull().default("CUSTOMER"),
    ...createdUpdated,
  },
  (table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...createdUpdated,
  },
  (table) => [uniqueIndex("session_token_unique").on(table.token), index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    ...createdUpdated,
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...createdUpdated,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const countries = pgTable("countries", {
  code: countryCodeEnum("code").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  identifierType: text("identifier_type").notNull(),
  identifierLabel: text("identifier_label").notNull(),
  cpdUnitType: cpdUnitTypeEnum("cpd_unit_type").notNull(),
  defaultTimezone: text("default_timezone").notNull(),
  description: text("description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...createdUpdated,
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    country: countryCodeEnum("country").notNull().references(() => countries.code, { onDelete: "restrict" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    visibility: categoryVisibilityEnum("visibility").notNull().default("VISIBLE"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("categories_country_slug_unique").on(table.country, table.slug),
    index("categories_country_visibility_idx").on(table.country, table.visibility, table.sortOrder),
  ],
);

export const sourceReferences = pgTable(
  "source_references",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authority: text("authority").notNull(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    jurisdiction: countryCodeEnum("jurisdiction").notNull(),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    ...createdUpdated,
  },
  (table) => [index("source_references_jurisdiction_idx").on(table.jurisdiction)],
);

export const presenters = pgTable(
  "presenters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    role: text("role").notNull(),
    location: text("location").notNull(),
    initials: text("initials").notNull(),
    bio: text("bio").notNull(),
    expertise: jsonb("expertise").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("presenters_slug_unique").on(table.slug),
    index("presenters_active_name_idx").on(table.isActive, table.name),
  ],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    country: countryCodeEnum("country").notNull().references(() => countries.code, { onDelete: "restrict" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
    presenterId: uuid("presenter_id").references(() => presenters.id, { onDelete: "set null" }),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull(),
    bookingOpensAt: timestamp("booking_opens_at", { withTimezone: true }).notNull(),
    bookingClosesAt: timestamp("booking_closes_at", { withTimezone: true }).notNull(),
    deliveryFormat: deliveryFormatEnum("delivery_format").notNull(),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    onlineAttendanceInfo: text("online_attendance_info"),
    priceMinorUnits: integer("price_minor_units").notNull(),
    currency: text("currency").notNull(),
    seatCapacity: integer("seat_capacity"),
    unlimitedCapacity: boolean("unlimited_capacity").notNull().default(false),
    cpdUnitType: cpdUnitTypeEnum("cpd_unit_type").notNull().default("NONE"),
    cpdUnitAmount: numeric("cpd_unit_amount", { precision: 10, scale: 2 }),
    cpdActivityCategory: text("cpd_activity_category"),
    professionalIdentifierRequired: boolean("professional_identifier_required").notNull().default(false),
    status: classStatusEnum("status").notNull().default("DRAFT"),
    mediaAltText: text("media_alt_text"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("classes_slug_unique").on(table.slug),
    index("classes_public_listing_idx").on(table.country, table.status, table.startAt),
    index("classes_category_idx").on(table.categoryId),
    check("classes_price_non_negative", sql`${table.priceMinorUnits} >= 0`),
    check("classes_capacity_valid", sql`${table.unlimitedCapacity} = true OR ${table.seatCapacity} > 0`),
    check("classes_schedule_valid", sql`${table.endAt} > ${table.startAt}`),
    check("classes_booking_window_valid", sql`${table.bookingClosesAt} >= ${table.bookingOpensAt}`),
  ],
);

export const classMedia = pgTable(
  "class_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    altText: text("alt_text").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    ...createdUpdated,
  },
  (table) => [index("class_media_class_id_idx").on(table.classId)],
);

export const classSourceReferences = pgTable(
  "class_source_references",
  {
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    sourceReferenceId: uuid("source_reference_id")
      .notNull()
      .references(() => sourceReferences.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.classId, table.sourceReferenceId] })],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    country: countryCodeEnum("country").notNull(),
    professionalIdentifierType: text("professional_identifier_type"),
    professionalIdentifier: text("professional_identifier"),
    createAccountRequested: boolean("create_account_requested").notNull().default(false),
    status: bookingStatusEnum("status").notNull().default("PENDING_PAYMENT"),
    amountSnapshot: integer("amount_snapshot").notNull(),
    currencySnapshot: text("currency_snapshot").notNull(),
    classTitleSnapshot: text("class_title_snapshot").notNull(),
    cpdUnitTypeSnapshot: cpdUnitTypeEnum("cpd_unit_type_snapshot"),
    cpdAmountSnapshot: numeric("cpd_amount_snapshot", { precision: 10, scale: 2 }),
    timezoneSnapshot: text("timezone_snapshot").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    seatReservationExpiresAt: timestamp("seat_reservation_expires_at", { withTimezone: true }),
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
    refundPolicyAcceptedAt: timestamp("refund_policy_accepted_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key").notNull(),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("bookings_idempotency_key_unique").on(table.idempotencyKey),
    uniqueIndex("bookings_checkout_session_unique").on(table.stripeCheckoutSessionId),
    uniqueIndex("bookings_payment_intent_unique").on(table.stripePaymentIntentId),
    index("bookings_class_status_idx").on(table.classId, table.status),
    index("bookings_user_created_idx").on(table.userId, table.createdAt),
    index("bookings_email_idx").on(table.email),
    check("bookings_amount_non_negative", sql`${table.amountSnapshot} >= 0`),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "restrict" }),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    amountTotal: integer("amount_total").notNull(),
    amountCaptured: integer("amount_captured").notNull().default(0),
    amountRefunded: integer("amount_refunded").notNull().default(0),
    currency: text("currency").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    receiptUrl: text("receipt_url"),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("payments_booking_unique").on(table.bookingId),
    uniqueIndex("payments_checkout_session_unique").on(table.stripeCheckoutSessionId),
    uniqueIndex("payments_payment_intent_unique").on(table.stripePaymentIntentId),
    index("payments_status_idx").on(table.status),
    check("payments_refund_not_over_capture", sql`${table.amountRefunded} <= ${table.amountCaptured}`),
  ],
);

export const refunds = pgTable(
  "refunds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id").notNull().references(() => bookings.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id").notNull().references(() => payments.id, { onDelete: "restrict" }),
    stripeRefundId: text("stripe_refund_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    status: refundStatusEnum("status").notNull().default("PENDING"),
    reason: text("reason").notNull(),
    internalNote: text("internal_note"),
    initiatedBy: text("initiated_by").references(() => user.id, { onDelete: "set null" }),
    requestIdempotencyKey: text("request_idempotency_key").notNull(),
    failureMessage: text("failure_message"),
    ...createdUpdated,
  },
  (table) => [
    uniqueIndex("refunds_stripe_id_unique").on(table.stripeRefundId),
    uniqueIndex("refunds_request_idempotency_unique").on(table.requestIdempotencyKey),
    index("refunds_booking_idx").on(table.bookingId, table.createdAt),
    check("refunds_amount_positive", sql`${table.amount} > 0`),
  ],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stripeEventId: text("stripe_event_id").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull().default("RECEIVED"),
    payload: jsonb("payload"),
    errorMessage: text("error_message"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [uniqueIndex("webhook_events_stripe_id_unique").on(table.stripeEventId), index("webhook_events_status_idx").on(table.status)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt), index("audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

export const accountClaimTokens = pgTable(
  "account_claim_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull(),
    email: text("email").notNull(),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
    purpose: tokenPurposeEnum("purpose").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [uniqueIndex("account_claim_tokens_hash_unique").on(table.tokenHash), index("account_claim_tokens_email_idx").on(table.email)],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dedupeKey: text("dedupe_key").notNull(),
    messageType: text("message_type").notNull(),
    recipientEmail: text("recipient_email").notNull(),
    payload: jsonb("payload").notNull(),
    status: outboxStatusEnum("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    ...createdUpdated,
  },
  (table) => [uniqueIndex("email_outbox_dedupe_unique").on(table.dedupeKey), index("email_outbox_processing_idx").on(table.status, table.nextAttemptAt)],
);

export const rateLimitBuckets = pgTable("rate_limit_buckets", {
  key: text("key").primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  bookings: many(bookings),
  auditLogs: many(auditLogs),
  refunds: many(refunds),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  country: one(countries, { fields: [categories.country], references: [countries.code] }),
  classes: many(classes),
}));

export const presenterRelations = relations(presenters, ({ many }) => ({
  classes: many(classes),
}));

export const classRelations = relations(classes, ({ one, many }) => ({
  country: one(countries, { fields: [classes.country], references: [countries.code] }),
  category: one(categories, { fields: [classes.categoryId], references: [categories.id] }),
  presenter: one(presenters, { fields: [classes.presenterId], references: [presenters.id] }),
  media: many(classMedia),
  bookings: many(bookings),
  sourceReferences: many(classSourceReferences),
}));

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  user: one(user, { fields: [bookings.userId], references: [user.id] }),
  class: one(classes, { fields: [bookings.classId], references: [classes.id] }),
  payment: one(payments, { fields: [bookings.id], references: [payments.bookingId] }),
  refunds: many(refunds),
}));

export const paymentRelations = relations(payments, ({ one, many }) => ({
  booking: one(bookings, { fields: [payments.bookingId], references: [bookings.id] }),
  refunds: many(refunds),
}));

export const refundRelations = relations(refunds, ({ one }) => ({
  booking: one(bookings, { fields: [refunds.bookingId], references: [bookings.id] }),
  payment: one(payments, { fields: [refunds.paymentId], references: [payments.id] }),
  initiatedByUser: one(user, { fields: [refunds.initiatedBy], references: [user.id] }),
}));

export const classSourceReferenceRelations = relations(classSourceReferences, ({ one }) => ({
  class: one(classes, { fields: [classSourceReferences.classId], references: [classes.id] }),
  sourceReference: one(sourceReferences, {
    fields: [classSourceReferences.sourceReferenceId],
    references: [sourceReferences.id],
  }),
}));

export type CountryCode = "AU" | "NZ";
export type UserRole = "CUSTOMER" | "ADMIN";
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export type ClassStatus = (typeof classStatusEnum.enumValues)[number];
export type RefundStatus = (typeof refundStatusEnum.enumValues)[number];
