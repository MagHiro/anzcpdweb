import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

export function formatMoney(amountMinorUnits: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(amountMinorUnits / 100);
}

export function formatDateTime(instant: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(instant));
}

export function formatDate(instant: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date(instant));
}

export function formatTime(instant: Date | string, timezone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(instant));
}

export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function safeErrorMessage(error: unknown, fallback = "An unexpected error occurred."): string {
  if (error instanceof Error && error.message && !/password|secret|token|sql|stripe_|postgres|database|drizzle|constraint|relation|syntax|stack trace|\bat \S+/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}

export function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error) || !error.message) return fallback;
  const message = error.message.trim();
  const knownSafe = /^(This class is no longer available|Booking has not opened|Booking is closed|This class has sold out|This booking is already being processed|This class has an invalid country|We couldn't start the payment session|We couldn't confirm the payment session state|This class is no longer available for booking|This booking is already closed|Only an unpaid booking can be cancelled here|Booking not found)/i;
  if (message.length <= 240 && knownSafe.test(message) && !/database|postgres|drizzle|constraint|relation|syntax|stack| at /i.test(message)) return message;
  return fallback;
}

export function safeInternalPath(value: string | undefined, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\r\n]|%5c/i.test(value)) return fallback;
  try {
    const parsed = new URL(value, "https://internal.invalid");
    return parsed.origin === "https://internal.invalid" ? value : fallback;
  } catch {
    return fallback;
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

export function makePublicBookingReference(id: string): string {
  return `CPD-${id.replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}
