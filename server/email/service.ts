import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { and, asc, eq, lte, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getServerEnv, resolveEmailProvider, type ServerEnv } from "@/lib/env";
import { emailOutbox, paymentReceipts } from "@/db/schema";
import { renderReceiptPdf } from "@/server/payments/receipt-pdf";
import { renderMessage } from "./render";
import { refreshEventReminder, type EventReminderMessage } from "./reminders";

let smtpTransporter: Transporter | undefined;

export type EmailMessage =
  | EventReminderMessage
  | {
      type: "PAYMENT_RECEIPT";
      email: string;
      name: string;
      receiptNumber: string;
      receiptId?: string;
      noPaymentRequired?: boolean;
      classTitle: string;
      amount: string;
      url: string;
    }
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
      meetingLink?: string;
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

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@", 2);
  if (!localPart || !domain) return "[masked]";
  return `${localPart.slice(0, 1)}***@${domain}`;
}

function getSmtpTransporter(env: ServerEnv): Transporter {
  if (!env.SMTP_HOST) throw new Error("SMTP_HOST is not configured");
  const hasUser = Boolean(env.SMTP_USER);
  const hasPassword = Boolean(env.SMTP_PASSWORD);
  if (hasUser !== hasPassword) throw new Error("SMTP_USER and SMTP_PASSWORD must be configured together");
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      requireTLS: env.SMTP_REQUIRE_TLS === "true",
      auth: hasUser && hasPassword ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
  }
  return smtpTransporter;
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
  if (message.type === "EVENT_REMINDER") return `event-reminder:${message.bookingId}:${message.eventStartAt}:${message.daysBefore}`;
  if (message.type === "PAYMENT_RECEIPT") return `payment-receipt:${message.receiptNumber}`;
  if (message.type === "BOOKING_CONFIRMATION") return `booking-confirmation:${message.bookingReference}`;
  if (message.type === "BOOKING_CANCELLED") return `booking-cancelled:${message.bookingReference}`;
  if (message.type === "ACCOUNT_SETUP") return `account-setup:${message.email.toLowerCase()}:${message.url}`;
  if (message.type === "ACCOUNT_CLAIM") return `account-claim:${message.email.toLowerCase()}:${message.url}`;
  if (message.type === "REFUND_STATUS") return `refund-status:${message.bookingReference}:${message.status}:${message.amount}`;
  return `${message.type.toLowerCase()}:${message.email.toLowerCase()}:${message.url}`;
}

export async function receiptEmailAttachments(message: EmailMessage): Promise<Array<{ filename: string; content: Buffer; contentType: string }>> {
  if (message.type !== "PAYMENT_RECEIPT") return [];
  // Older queued messages have the receipt number but not receiptId.
  const id = message.receiptId;
  const compactId = message.receiptNumber.replace(/^R-/, "").toLowerCase();
  const legacyId = /^[a-f0-9]{32}$/.test(compactId)
    ? compactId.replace(/^(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})$/, "$1-$2-$3-$4-$5") : undefined;
  if (!id && !legacyId) throw new Error("Receipt email is missing a valid receipt reference");
  const [receipt] = await getDb().select().from(paymentReceipts).where(eq(paymentReceipts.id, id ?? legacyId!)).limit(1);
  if (!receipt || receipt.recipientEmail !== message.email) throw new Error("Receipt email does not match the saved payment receipt");
  return [{ filename: `ANZ-Receipt-${receipt.id}.pdf`, content: await renderReceiptPdf(receipt), contentType: "application/pdf" }];
}

async function deliver(message: EmailMessage): Promise<void> {
  const env = getServerEnv();
  const rendered = await renderMessage(message);
  const provider = resolveEmailProvider(env);
  const attachments = await receiptEmailAttachments(message);

  if (provider === "smtp") {
    await getSmtpTransporter(env).sendMail({
      from: env.EMAIL_FROM,
      to: message.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments,
    });
    return;
  }

  if (provider === "resend") {
    if (!env.RESEND_API_KEY) {
      if (env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
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
      attachments: attachments.map(({ filename, content, contentType }) => ({ filename, content: content.toString("base64"), contentType })),
    });
    if (result.error) throw new Error(`Email provider rejected the message: ${result.error.message}`);
    return;
  }

  if (env.NODE_ENV === "production") throw new Error("Transactional email is not configured; set SMTP_HOST or RESEND_API_KEY");
  console.info("[email:development]", { to: maskEmail(message.email), subject: rendered.subject });
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
      let message = row.payload as EmailMessage;
      if (message.type === "EVENT_REMINDER") {
        const refreshed = await refreshEventReminder(message);
        if (!refreshed) {
          await db.delete(emailOutbox).where(eq(emailOutbox.id, row.id));
          continue;
        }
        message = refreshed;
      }
      await deliver(message);
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
