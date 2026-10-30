import { Resend } from "resend";
import nodemailer, { type Transporter } from "nodemailer";
import { and, asc, eq, lte, lt, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { getServerEnv, resolveEmailProvider, type ServerEnv } from "@/lib/env";
import { emailOutbox, paymentReceipts } from "@/db/schema";
import { renderReceiptPdf } from "@/server/payments/receipt-pdf";

let smtpTransporter: Transporter | undefined;

export type EmailMessage =
  | {
      type: "PAYMENT_RECEIPT";
      email: string;
      name: string;
      receiptNumber: string;
      receiptId?: string;
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
  if (message.type === "PAYMENT_RECEIPT") return `payment-receipt:${message.receiptNumber}`;
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
    case "PAYMENT_RECEIPT":
      return {
        subject: `Your payment receipt · ${message.amount}`,
        html: `<div style="background:#f4f5f0;padding:32px 16px;font-family:Arial,sans-serif;color:#183e32"><div style="max-width:560px;margin:auto;background:white;padding:40px;border-top:4px solid #245c45"><p style="font-size:18px;font-weight:bold;margin:0 0 40px">ANZ Migration Academy</p><h1 style="font-size:32px;font-weight:500;margin:0">Payment received</h1><p style="font-size:36px;margin:16px 0 32px">${escapeHtml(message.amount)}</p><p>${greeting}</p><p style="line-height:1.6">${escapeHtml(message.classTitle)}</p><p style="font-size:12px;color:#59645c;overflow-wrap:anywhere">Receipt ${escapeHtml(message.receiptNumber)}</p><p style="margin-top:32px"><a style="background:#183e32;color:white;padding:14px 20px;display:inline-block;text-decoration:none" href="${escapeHtml(message.url)}">View / print receipt</a></p><p style="font-size:12px;color:#59645c;line-height:1.6">Your private receipt link is valid for 30 days. This receipt records payment, not attendance confirmation.</p></div></div>`,
        text: `Hello ${message.name},\n\nPayment received: ${message.amount}\n${message.classTitle}\nReceipt: ${message.receiptNumber}\n\nView / print receipt: ${message.url}\n\nThis private link is valid for 30 days. This receipt records payment, not attendance confirmation.`,
      };
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
  const rendered = renderMessage(message);
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
