import Link from "next/link";
import { Children, cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import type { CountryCode } from "@/db/schema";
import { cn, formatMoney } from "@/lib/utils";
import { getCountryConfig, getCpdLabel } from "@/lib/domain/countries";
import { FeedbackNotice } from "@/components/admin-feedback";
import { VisitorTime } from "@/components/visitor-time";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";
export type ButtonSize = "sm" | "md" | "lg";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("page-container mx-auto w-full px-5 md:px-8 xl:px-12", className)} {...props} />;
}

export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-10 sm:py-16", className)} {...props}>{children}</section>;
}

export function PageIntro({ eyebrow, title, description, children, className, tone = "dark" }: { eyebrow?: string; title: string; description?: string; children?: ReactNode; className?: string; tone?: "dark" | "light" }) {
  return <div className={cn("max-w-4xl", className)}>{eyebrow ? <p className={cn("eyebrow", tone === "light" ? "text-[#bdd8cc]" : "text-[var(--fern)]")}>{eyebrow}</p> : null}<h1 className={cn("display mt-4 text-4xl leading-[1.08] sm:text-6xl", tone === "light" ? "text-white" : "text-[var(--forest)]")}>{title}</h1>{description ? <p className={cn("mt-6 max-w-2xl text-base leading-7 sm:text-lg", tone === "light" ? "text-[#c9ddd5]" : "text-[var(--muted)]")}>{description}</p> : null}{children ? <div className="mt-8">{children}</div> : null}</div>;
}

export function PageHeader({ eyebrow, title, description, actions, className, headingLevel = "h1" }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode; className?: string; headingLevel?: "h1" | "h2" | "h3" }) {
  const Heading = headingLevel;
  return <div className={cn("flex flex-wrap items-end justify-between gap-5", className)}><div className="min-w-0">{eyebrow ? <p className="eyebrow text-[var(--fern)]">{eyebrow}</p> : null}<Heading className="display mt-3 max-w-4xl text-4xl leading-[1.02] text-[var(--forest)] sm:text-5xl">{title}</Heading>{description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}</div>{actions ? <div className="shrink-0">{actions}</div> : null}</div>;
}

export function AuthFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode; aside?: string }) {
  return <Section className="auth-page"><Container><div className="auth-panel" aria-label={eyebrow}><header><h1 className="display">{title}</h1><p className="mt-4 text-[var(--muted)]">{description}</p></header><div className="mt-8">{children}</div></div><p className="mt-6 text-center text-sm"><Link href="/classes" className="ink-link">Back to the catalogue ↗</Link></p></Container></Section>;
}

export function Button({ className, variant = "primary", size = "md", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cn("focus-ring inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50", size === "sm" && "min-h-10 px-4 text-xs", size === "md" && "min-h-12 px-6", size === "lg" && "min-h-12 px-6", variant === "primary" && "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]", variant === "secondary" && "border border-[var(--color-border)] bg-white text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "quiet" && "bg-transparent text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", size = "md", ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cn("focus-ring inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition duration-200", size === "sm" && "min-h-10 px-4 text-xs", size === "md" && "min-h-12 px-6", size === "lg" && "min-h-12 px-6", variant === "primary" && "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]", variant === "secondary" && "border border-[var(--color-border)] bg-white text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "quiet" && "bg-transparent text-[var(--color-brand)] hover:bg-[var(--color-inset)]", variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
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
  const content = <div className="metric-tile rounded-[1.25rem] bg-[var(--surface)] p-6"><p className="text-sm font-medium text-[var(--muted)]">{label}</p><p className="display mt-4 text-[2.7rem] font-semibold text-[var(--forest)]">{value}</p>{detail ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}</div>;
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
  return <div className={cn("form-field", className)}><label htmlFor={controlId} className="block text-sm font-semibold text-[var(--ink)]">{label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--signal)]">*</span> : null}</label>{control}{hint ? <p id={hintId} className="text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}{error ? <p id={errorId} className="text-sm text-[var(--error)]" role="alert">{error}</p> : null}</div>;
}

export const inputClassName = "form-control focus-ring min-h-12 w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-subtle)] focus:border-[var(--forest)] focus:bg-white";

export function TextInput({ className, ...props }: ComponentProps<"input">) { return <input className={cn(inputClassName, className)} {...props} />; }
export function TextArea({ className, ...props }: ComponentProps<"textarea">) { return <textarea className={cn(inputClassName, "min-h-32 py-3", className)} {...props} />; }
export function Select({ className, ...props }: ComponentProps<"select">) { return <select className={cn(inputClassName, "form-select", className)} {...props} />; }

export function FormNotice({ children, tone = "error", className }: { children?: ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  return <FeedbackNotice tone={tone} className={className}>{children}</FeedbackNotice>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) { return <span className="data-numeric font-bold tracking-[-.03em]">{formatMoney(amount, currency)}</span>; }

export type ActivityCardItem = { slug: string; title: string; shortDescription: string; country: CountryCode; categoryName: string; presenterName?: string | null; cpdActivityCategory?: string | null; startAt: Date; timezone: string; deliveryFormat: string; venueName?: string | null; venueAddress?: string | null; priceMinorUnits: number; currency: string; remainingSeats: number | null; cpdUnitType: string; cpdUnitAmount: string | null };

export function ActivityCard({ item }: { item: ActivityCardItem }) {
  const cpd = getCpdLabel(item.cpdUnitType, item.cpdUnitAmount);
  const date = <VisitorTime startAt={new Date(item.startAt).toISOString()} timezone={item.timezone} allowConversion={item.deliveryFormat === "ONLINE"} compact />;
  return <article className="card-lift activity-card group flex h-full min-w-0 flex-col">
    <div className="px-6 pt-6">
      <span className="text-xs font-medium uppercase tracking-[.04em] text-[var(--fern)]">{getCountryConfig(item.country).name}</span>
    </div>
    <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
      <h3 className="activity-card-title md:min-h-[60px]"><Link href={`/classes/${item.slug}`} className="focus-ring rounded-sm underline-offset-4 group-hover:underline">{item.title}</Link></h3>
      <p className="mt-3 line-clamp-2 text-[15px] leading-6 text-[var(--muted)] md:min-h-12">{item.shortDescription}</p>
      <dl className="mt-5 grid gap-4 text-sm leading-6">
        <div className="flex items-start gap-3"><dt><ActivityDetailIcon kind="calendar" /><span className="sr-only">Date & time</span></dt><dd>{date}</dd></div>
        <div className="flex items-start gap-3"><dt><ActivityDetailIcon kind="location" /><span className="sr-only">Location</span></dt><dd className="min-w-0 break-words">Location: <span className="font-medium">{item.deliveryFormat === "ONLINE" ? "Online" : item.venueName?.trim() || item.venueAddress?.trim() || "Venue to be confirmed"}</span>{item.deliveryFormat !== "ONLINE" && item.venueName?.trim() && item.venueAddress?.trim() && <span className="block text-xs text-[var(--muted)]">{item.venueAddress}</span>}{item.deliveryFormat === "HYBRID" && <span className="block text-xs text-[var(--muted)]">Online attendance also available</span>}</dd></div>
        <div className="flex items-start gap-3"><dt><ActivityDetailIcon kind="clock" /><span className="sr-only">CPD</span></dt><dd>{cpd ?? "CPD not specified"}{item.cpdActivityCategory ? ` · ${item.cpdActivityCategory}` : ""}</dd></div>
        {item.presenterName && <div className="flex items-start gap-3"><dt><ActivityDetailIcon kind="person" /><span className="sr-only">Presenter</span></dt><dd>{item.presenterName}</dd></div>}
      </dl>
      <div className="mt-auto pt-6"><div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
        <div><p className="text-xl text-[var(--forest)]"><Price amount={item.priceMinorUnits} currency={item.currency} /></p>{item.remainingSeats !== null && <p className="mt-1 text-xs text-[var(--muted)]">{item.remainingSeats === 0 ? "Sold out" : `${item.remainingSeats} places available`}</p>}</div>
         <LinkButton href={`/classes/${item.slug}`} size="sm" aria-label={`View details: ${item.title}`}>View details ↗</LinkButton>
      </div></div>
    </div>
  </article>;
}

function ActivityDetailIcon({ kind }: { kind: "calendar" | "location" | "clock" | "person" }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[var(--muted)]">{kind === "calendar" ? <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2m-8 3h2" /></> : kind === "location" ? <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> : kind === "clock" ? <><circle cx="12" cy="12" r="9" /><path d="M12 7v5h4" /></> : <><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}</svg>;
}

export function ClassCard({ item }: { item: ActivityCardItem }) {
  return <ActivityCard item={item} />;
}

export function EmptyState({ title, description, action, eyebrow = "Nothing here yet" }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="soft-card rounded-[1.3rem] bg-[var(--color-surface)] px-6 py-14 text-center"><p className="eyebrow text-[var(--fern)]">{eyebrow}</p><h2 className="mt-3 text-2xl font-bold tracking-[-.02em] text-[var(--color-ink)]">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-muted)]">{description}</p>{action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}</div>;
}

export function Pagination({ page, hasNext, previousHref, nextHref }: { page: number; hasNext: boolean; previousHref: string; nextHref: string }) {
  if (page === 1 && !hasNext) return null;
  return <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5 text-sm"><div>{page > 1 ? <Link href={previousHref} className="focus-ring rounded-[.55rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-bold text-[var(--color-brand)] hover:border-[var(--color-brand)]">Previous</Link> : <span />}</div><span className="data-numeric text-xs font-bold uppercase tracking-[.12em] text-[var(--color-muted)]">Page {page}</span><div>{hasNext ? <Link href={nextHref} className="focus-ring rounded-[.55rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 font-bold text-[var(--color-brand)] hover:border-[var(--color-brand)]">Next</Link> : <span />}</div></nav>;
}
