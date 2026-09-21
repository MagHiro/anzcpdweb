import { Resend } from "resend";
import { and, asc, eq, lte, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { emailOutbox } from "@/db/schema";

export type EmailMessage =
  | {
      type: "EMAIL_VERIFICATION" | "PASSWORD_RESET";
      email: string;
      name: string;
      url: string;
    }
  | {
      type: "BOOKING_CONFIRMATION";
      email: string;
      name: string;
      bookingReference: string;
      classTitle: string;
      classDate: string;
      detailUrl: string;
      amount: string;
    }
  | {
      type: "BOOKING_CANCELLED";
      email: string;
      name: string;
      bookingReference: string;
      classTitle: string;
      reason: string;
      detailUrl: string;
    }
  | {
      type: "ACCOUNT_SETUP" | "ACCOUNT_CLAIM";
      email: string;
      name: string;
      url: string;
    }
  | {
      type: "REFUND_STATUS";
      email: string;
      name: string;
      bookingReference: string;
      amount: string;
      status: string;
      detailUrl: string;
    };

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] ?? character;
  });
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@", 2);
  if (!localPart || !domain) return "[masked]";
  return `${localPart.slice(0, 1)}***@${domain}`;
}

export async function queueEmail(message: EmailMessage, dedupeKey?: string): Promise<void> {
  const db = getDb();
  await db.insert(emailOutbox).values({
    dedupeKey: dedupeKey ?? emailDedupeKey(message),
    messageType: message.type,
    recipientEmail: message.email,
    payload: message,
  }).onConflictDoNothing({ target: emailOutbox.dedupeKey });
}

function emailDedupeKey(message: EmailMessage): string {
  if (message.type === "BOOKING_CONFIRMATION") return `booking-confirmation:${message.bookingReference}`;
  if (message.type === "BOOKING_CANCELLED") return `booking-cancelled:${message.bookingReference}`;
  if (message.type === "ACCOUNT_SETUP") return `account-setup:${message.email.toLowerCase()}:${message.url}`;
  if (message.type === "ACCOUNT_CLAIM") return `account-claim:${message.email.toLowerCase()}:${message.url}`;
  if (message.type === "REFUND_STATUS") return `refund-status:${message.bookingReference}:${message.status}:${message.amount}`;
  return `${message.type.toLowerCase()}:${message.email.toLowerCase()}:${message.url}`;
}

function renderMessage(message: EmailMessage): { subject: string; html: string; text: string } {
  const greeting = `Hello ${escapeHtml(message.name)},`;
  switch (message.type) {
    case "EMAIL_VERIFICATION":
      return {
        subject: "Verify your ANZ CPD email address",
        html: `<p>${greeting}</p><p>Verify your email address to finish setting up your account.</p><p><a href="${escapeHtml(message.url)}">Verify email address</a></p>`,
        text: `Hello ${message.name},\n\nVerify your email address: ${message.url}`,
      };
    case "PASSWORD_RESET":
      return {
        subject: "Reset your ANZ CPD password",
        html: `<p>${greeting}</p><p>Use the secure link below to reset your password. If you did not request this, you can ignore this email.</p><p><a href="${escapeHtml(message.url)}">Reset password</a></p>`,
        text: `Hello ${message.name},\n\nReset your password: ${message.url}`,
      };
    case "ACCOUNT_SETUP":
      return {
        subject: "Set up your ANZ CPD account",
        html: `<p>${greeting}</p><p>Your paid CPD booking is ready to manage online. Set up a secure password using the link below.</p><p><a href="${escapeHtml(message.url)}">Set up your account</a></p>`,
        text: `Hello ${message.name},\n\nSet up your account: ${message.url}`,
      };
    case "ACCOUNT_CLAIM":
      return {
        subject: "Connect your ANZ CPD booking to your account",
        html: `<p>${greeting}</p><p>Sign in to connect your previous booking records to your account.</p><p><a href="${escapeHtml(message.url)}">Connect booking records</a></p>`,
        text: `Hello ${message.name},\n\nConnect your booking records: ${message.url}`,
      };
    case "BOOKING_CONFIRMATION":
      return {
        subject: `Booking confirmed: ${escapeHtml(message.classTitle)}`,
        html: `<p>${greeting}</p><p>Your booking is confirmed.</p><p><strong>${escapeHtml(message.classTitle)}</strong><br>${escapeHtml(message.classDate)}<br>Reference: ${escapeHtml(message.bookingReference)}<br>Paid: ${escapeHtml(message.amount)}</p><p><a href="${escapeHtml(message.detailUrl)}">View booking details</a></p>`,
        text: `Hello ${message.name},\n\nYour booking is confirmed.\n${message.classTitle}\n${message.classDate}\nReference: ${message.bookingReference}\nPaid: ${message.amount}\n\nView booking details: ${message.detailUrl}`,
      };
    case "BOOKING_CANCELLED":
      return {
        subject: `Booking update: ${escapeHtml(message.classTitle)}`,
        html: `<p>${greeting}</p><p>Your booking has been cancelled.</p><p><strong>${escapeHtml(message.classTitle)}</strong><br>Reference: ${escapeHtml(message.bookingReference)}<br>${escapeHtml(message.reason)}</p><p><a href="${escapeHtml(message.detailUrl)}">View class information</a></p>`,
        text: `Hello ${message.name},\n\nYour booking has been cancelled.\n${message.classTitle}\nReference: ${message.bookingReference}\n${message.reason}\n\nView class information: ${message.detailUrl}`,
      };
    case "REFUND_STATUS":
      return {
        subject: `Refund update: ${message.bookingReference}`,
        html: `<p>${greeting}</p><p>Your refund is currently <strong>${escapeHtml(message.status)}</strong>.</p><p>Amount: ${escapeHtml(message.amount)}<br>Reference: ${escapeHtml(message.bookingReference)}</p><p><a href="${escapeHtml(message.detailUrl)}">View booking details</a></p>`,
        text: `Hello ${message.name},\n\nRefund status: ${message.status}\nAmount: ${message.amount}\nReference: ${message.bookingReference}\n\nView booking details: ${message.detailUrl}`,
      };
  }
}

async function deliver(message: EmailMessage): Promise<void> {
  const env = getServerEnv();
  const rendered = renderMessage(message);
  if (!env.RESEND_API_KEY) {
    if (env.NODE_ENV === "production") throw new Error("Transactional email is not configured");
    console.info("[email:development]", { to: maskEmail(message.email), subject: rendered.subject });
    return;
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [message.email],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });
  if (result.error) throw new Error(`Email provider rejected the message: ${result.error.message}`);
}

export async function processEmailOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  const now = new Date();
  const processingLeaseExpiredAt = new Date(now.getTime() - 15 * 60 * 1000);
  const rows = await db
    .select()
    .from(emailOutbox)
    .where(and(or(eq(emailOutbox.status, "PENDING"), eq(emailOutbox.status, "FAILED"), and(eq(emailOutbox.status, "PROCESSING"), lt(emailOutbox.updatedAt, processingLeaseExpiredAt))), lte(emailOutbox.nextAttemptAt, now)))
    .orderBy(asc(emailOutbox.nextAttemptAt))
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const claimed = await db
      .update(emailOutbox)
      .set({ status: "PROCESSING", attempts: row.attempts + 1, updatedAt: new Date() })
      .where(and(eq(emailOutbox.id, row.id), or(eq(emailOutbox.status, "PENDING"), eq(emailOutbox.status, "FAILED"), and(eq(emailOutbox.status, "PROCESSING"), lt(emailOutbox.updatedAt, processingLeaseExpiredAt)))))
      .returning({ id: emailOutbox.id });
    if (!claimed.length) continue;

    try {
      await deliver(row.payload as EmailMessage);
      await db.update(emailOutbox).set({ status: "SENT", sentAt: new Date(), updatedAt: new Date() }).where(eq(emailOutbox.id, row.id));
      sent += 1;
    } catch (error) {
      const nextAttempt = new Date(Date.now() + Math.min(60 * 60 * 1000, 2 ** Math.min(row.attempts, 10) * 1000));
      await db
        .update(emailOutbox)
        .set({ status: "FAILED", lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error", nextAttemptAt: nextAttempt, updatedAt: new Date() })
        .where(eq(emailOutbox.id, row.id));
      failed += 1;
    }
  }
  return { sent, failed };
}
