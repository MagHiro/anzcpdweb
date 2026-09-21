import Link from "next/link";
import { Children, cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import type { CountryCode } from "@/db/schema";
import { cn, formatMoney } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";
export type ButtonSize = "sm" | "md" | "lg";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12", className)} {...props} />;
}

export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-14 sm:py-20", className)} {...props}>{children}</section>;
}

export function PageIntro({ eyebrow, title, description, children, className, tone = "dark" }: { eyebrow?: string; title: string; description?: string; children?: ReactNode; className?: string; tone?: "dark" | "light" }) {
  return <div className={cn("max-w-4xl", className)}>{eyebrow ? <p className={cn("eyebrow", tone === "light" ? "text-[#bdd8cc]" : "text-[var(--fern)]")}>{eyebrow}</p> : null}<h1 className={cn("display mt-4 text-4xl leading-[1.08] sm:text-6xl", tone === "light" ? "text-white" : "text-[var(--forest)]")}>{title}</h1>{description ? <p className={cn("mt-6 max-w-2xl text-base leading-7 sm:text-lg", tone === "light" ? "text-[#c9ddd5]" : "text-[var(--muted)]")}>{description}</p> : null}{children ? <div className="mt-8">{children}</div> : null}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className, headingLevel = "h1" }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string; headingLevel?: "h1" | "h2" | "h3" }) {
  const Heading = headingLevel;
  return <div className={cn("flex flex-wrap items-end justify-between gap-5", className)}><div className="min-w-0">{eyebrow ? <p className="eyebrow text-[var(--fern)]">{eyebrow}</p> : null}<Heading className="display mt-3 max-w-4xl text-4xl leading-[1.02] text-[var(--forest)] sm:text-5xl">{title}</Heading>{description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}</div>{actions ? <div className="shrink-0">{actions}</div> : null}</div>;
}

export function AuthFrame({ eyebrow, title, description, children, aside = "Find your bookings and attendance details in one secure place." }: { eyebrow: string; title: string; description: string; children: ReactNode; aside?: string }) {
  return <Section className="bg-[var(--mist)]"><Container className="max-w-6xl"><div className="grid items-start gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20"><div className="py-4 lg:py-10"><p className="eyebrow text-[var(--fern)]">{eyebrow}</p><h1 className="display mt-5 max-w-lg text-5xl leading-[1.08] sm:text-6xl">{title}</h1><p className="mt-6 max-w-md text-base leading-8 text-[var(--muted)]">{description}</p><div className="mt-10 max-w-sm border-t border-[var(--color-border-strong)] pt-6"><p className="text-sm font-semibold">Your next step, made simpler.</p><p className="mt-3 text-sm leading-7 text-[var(--muted)]">{aside}</p><Link href="/classes" className="mt-5 inline-block text-xs font-semibold underline underline-offset-4">Just browsing? Explore activities ↗</Link></div></div><div className="rounded-xl border border-[var(--line)] bg-white p-6 sm:p-9">{children}</div></div></Container></Section>;
}

export function Button({ className, variant = "primary", size = "md", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn("focus-ring inline-flex items-center justify-center rounded-[.6rem] text-sm font-bold tracking-[-.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50", size === "sm" && "min-h-9 px-3.5 text-xs", size === "md" && "min-h-11 px-5", size === "lg" && "min-h-12 px-5.5", variant === "primary" && "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]", variant === "secondary" && "border border-[var(--color-brand)] bg-transparent text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "quiet" && "text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", size = "md", ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cn("focus-ring inline-flex items-center justify-center rounded-[.6rem] text-sm font-bold tracking-[-.01em] transition duration-200", size === "sm" && "min-h-9 px-3.5 text-xs", size === "md" && "min-h-11 px-5", size === "lg" && "min-h-12 px-5.5", variant === "primary" && "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]", variant === "secondary" && "border border-[var(--color-brand)] bg-transparent text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "quiet" && "text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-normal", tone === "neutral" && "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]", tone === "green" && "border-[#b9d7ca] bg-[#edf7f1] text-[#28634e]", tone === "amber" && "border-[#e5d0ae] bg-[#fbf3e7] text-[#8d5b24]", tone === "red" && "border-[#e8beb8] bg-[#fff0ee] text-[var(--error)]", tone === "blue" && "border-[#bfd5dc] bg-[#edf5f7] text-[var(--info)]", className)}>{children}</span>;
}

export function CountryBadge({ country }: { country: CountryCode }) {
  return <Badge tone={country === "AU" ? "green" : "blue"}>{country === "AU" ? "Australia" : "New Zealand"}</Badge>;
}

const statusLabels: Record<string, string> = {
  AU: "Australia",
  NZ: "New Zealand",
  AUSTRALIA: "Australia",
  NEW_ZEALAND: "New Zealand",
  CONFIRMED: "Confirmed",
  PARTIALLY_REFUNDED: "Partially refunded",
  PAYMENT_PROCESSING: "Payment processing",
  PENDING_PAYMENT: "Awaiting payment",
  PAYMENT_FAILED: "Payment failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  EXPIRED: "Expired",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  PROCESSING: "Processing",
  PENDING: "Pending",
  REQUIRES_ACTION: "Action required",
  PUBLISHED: "Published",
  SCHEDULED: "Scheduled",
  SOLD_OUT: "Sold out",
  COMPLETED: "Completed",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
  CONFIGURED: "Configured",
  VERIFIED: "Verified",
  UNVERIFIED: "Not verified",
  MISSING: "Missing",
  ACTIVE: "Active",
};

export function formatStatusLabel(status: string): string {
  return statusLabels[status] ?? status.replaceAll("_", " ").toLowerCase().replace(/(^| )\w/g, (value) => value.toUpperCase());
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone = status.includes("CONFIRMED") || ["SUCCEEDED", "PUBLISHED", "SCHEDULED", "CONFIGURED", "VERIFIED", "ACTIVE"].includes(status) ? "green" : ["FAILED", "CANCELLED", "REFUNDED", "ARCHIVED", "MISSING", "UNVERIFIED"].includes(status) || status.includes("FAILED") ? "red" : status.includes("PENDING") || status.includes("PROCESSING") || ["DRAFT", "REQUIRES_ACTION"].includes(status) ? "amber" : "neutral";
  return <Badge tone={tone}>{formatStatusLabel(status)}</Badge>;
}

export function MetricCard({ label, value, detail, href }: { label: string; value: ReactNode; detail?: string; href?: string }) {
  const content = <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-none"><p className="eyebrow text-[var(--muted)]">{label}</p><p className="display mt-4 text-4xl text-[var(--forest)]">{value}</p>{detail ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}</div>;
  return href ? <Link className="focus-ring card-lift block rounded-xl" href={href}>{content}</Link> : content;
}

export function Field({ label, hint, error, children, required = false, className }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  const generatedId = useId().replaceAll(":", "");
  const child = Children.only(children);
  const childProps = isValidElement(child) ? child.props as { id?: string; name?: string; "aria-describedby"?: string } : {};
  const controlId = childProps.id ?? `${generatedId}-field`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [childProps["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(child) ? cloneElement(child as ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>, { id: controlId, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined }) : child;
  return <div className={cn("space-y-2", className)}><label htmlFor={controlId} className="block text-sm font-bold text-[var(--ink)]">{label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--signal)]">*</span> : null}</label>{hint ? <p id={hintId} className="text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}{control}{error ? <p id={errorId} className="text-sm text-[var(--error)]" role="alert">{error}</p> : null}</div>;
}

export const inputClassName = "focus-ring min-h-11 w-full rounded-[.6rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--color-brand)] focus:bg-white";

export function TextInput({ className, ...props }: ComponentProps<"input">) { return <input className={cn(inputClassName, className)} {...props} />; }
export function TextArea({ className, ...props }: ComponentProps<"textarea">) { return <textarea className={cn(inputClassName, "min-h-32 py-3", className)} {...props} />; }
export function Select({ className, ...props }: ComponentProps<"select">) { return <select className={cn(inputClassName, "appearance-auto", className)} {...props} />; }

export function FormNotice({ children, tone = "error", className }: { children?: ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  if (!children) return null;
  return <div className={cn("rounded-[.6rem] border px-4 py-3 text-sm leading-6", tone === "error" && "border-[#e8beb8] bg-[var(--color-danger-soft)] text-[var(--color-danger)]", tone === "success" && "border-[#b9d7ca] bg-[var(--color-success-soft)] text-[var(--color-success)]", tone === "info" && "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]", className)} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) { return <span className="data-numeric font-bold tracking-[-.03em]">{formatMoney(amount, currency)}</span>; }

export type ActivityCardItem = { slug: string; title: string; shortDescription: string; country: CountryCode; categoryName: string; presenterName?: string | null; cpdActivityCategory?: string | null; startAt: Date; timezone: string; deliveryFormat: string; priceMinorUnits: number; currency: string; remainingSeats: number | null; cpdUnitType: string; cpdUnitAmount: string | null };

export function ActivityCard({ item }: { item: ActivityCardItem }) {
  const cpd = getCpdLabel(item.cpdUnitType, item.cpdUnitAmount);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: item.timezone }).format(new Date(item.startAt));
  const time = new Intl.DateTimeFormat("en-AU", { timeStyle: "short", timeZone: item.timezone }).format(new Date(item.startAt));
  return <article className="card-lift group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white"><div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--mist)] px-5 py-4"><CountryBadge country={item.country} /><span className="text-xs font-medium text-[var(--muted)]">{formatStatusLabel(item.deliveryFormat)}</span></div><div className="flex flex-1 flex-col p-6"><p className="text-xs font-semibold text-[var(--fern)]">{item.categoryName}</p><h3 className="mt-3 text-xl font-semibold leading-snug"><Link href={`/classes/${item.slug}`} className="focus-ring group-hover:underline underline-offset-4">{item.title}</Link></h3><p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--muted)]">{item.shortDescription}</p>{item.presenterName && <p className="mt-4 text-xs text-[var(--muted)]">With <span className="font-semibold text-[var(--ink)]">{item.presenterName}</span></p>}<dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-5 text-xs"><div><dt className="text-[var(--muted)]">Date & time</dt><dd className="mt-2 font-semibold">{date}<span className="mt-1 block font-normal">{time} · {item.timezone}</span></dd></div><div><dt className="text-[var(--muted)]">CPD value</dt><dd className="mt-2 font-semibold">{cpd ?? "Not specified"}<span className="mt-1 block font-normal">{item.cpdActivityCategory ?? "Professional development"}</span></dd></div></dl><div className="mt-auto pt-6"><div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5"><div><p className="text-lg"><Price amount={item.priceMinorUnits} currency={item.currency} /></p><p className="mt-1 text-[11px] text-[var(--muted)]">{item.remainingSeats === null ? "No seat limit" : item.remainingSeats === 0 ? "Sold out" : `${item.remainingSeats} places available`}</p></div><LinkButton href={`/classes/${item.slug}`} variant="secondary" size="sm">View details ↗</LinkButton></div></div></div></article>;
}

export function ClassCard({ item }: { item: ActivityCardItem }) {
  return <ActivityCard item={item} />;
}

export function EmptyState({ title, description, action, eyebrow = "Nothing here yet" }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="rounded-[.85rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center"><p className="eyebrow text-[var(--fern)]">{eyebrow}</p><h2 className="mt-3 text-2xl font-bold tracking-[-.02em] text-[var(--color-ink)]">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-muted)]">{description}</p>{action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}</div>;
}

export function Pagination({ page, hasNext, previousHref, nextHref }: { page: number; hasNext: boolean; previousHref: string; nextHref: string }) {
  if (page === 1 && !hasNext) return null;
  return <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5 text-sm"><div>{page > 1 ? <Link href={previousHref} className="focus-ring rounded-[.55rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-bold text-[var(--color-brand)] hover:border-[var(--color-brand)]">Previous</Link> : <span />}</div><span className="data-numeric text-xs font-bold uppercase tracking-[.12em] text-[var(--color-muted)]">Page {page}</span><div>{hasNext ? <Link href={nextHref} className="focus-ring rounded-[.55rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-bold text-[var(--color-brand)] hover:border-[var(--color-brand)]">Next</Link> : <span />}</div></nav>;
}
