import Link from "next/link";
import { Children, cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import type { CountryCode } from "@/db/schema";
import { cn, formatMoney } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type BadgeTone = "neutral" | "green" | "amber" | "red" | "blue";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12", className)} {...props} />;
}

export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-24", className)} {...props}>{children}</section>;
}

export function PageIntro({ eyebrow, title, description, children, className, tone = "dark" }: { eyebrow?: string; title: string; description?: string; children?: ReactNode; className?: string; tone?: "dark" | "light" }) {
  return <div className={cn("max-w-4xl", className)}>{eyebrow ? <p className={cn("eyebrow", tone === "light" ? "text-[#bdd8cc]" : "text-[var(--fern)]")}>{eyebrow}</p> : null}<h1 className={cn("display mt-4 text-5xl leading-[.97] sm:text-7xl", tone === "light" ? "text-white" : "text-[var(--forest)]")}>{title}</h1>{description ? <p className={cn("mt-6 max-w-2xl text-base leading-7 sm:text-lg", tone === "light" ? "text-[#c9ddd5]" : "text-[var(--muted)]")}>{description}</p> : null}{children ? <div className="mt-8">{children}</div> : null}</div>;
}

export function AuthFrame({ eyebrow, title, description, children, aside = "Your bookings, payment state and CPD records in one secure place." }: { eyebrow: string; title: string; description: string; children: ReactNode; aside?: string }) {
  return <Section className="bg-[var(--paper)]"><Container><div className="grid overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-soft)] lg:grid-cols-[.88fr_1.12fr]"><div className="surface-grid bg-[var(--mist)] p-7 sm:p-10 lg:p-14"><p className="eyebrow text-[var(--fern)]">{eyebrow}</p><h1 className="display mt-4 text-5xl leading-[.96] text-[var(--forest)] sm:text-6xl">{title}</h1><p className="mt-5 max-w-md text-base leading-7 text-[var(--muted)]">{description}</p><div className="mt-12 border-t border-[var(--line)] pt-5"><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--fern)]">Built for confidence</p><p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">{aside}</p></div></div><div className="p-7 sm:p-10 lg:p-14"><div className="mx-auto max-w-md">{children}</div></div></div></Container></Section>;
}

export function Button({ className, variant = "primary", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cn("focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold tracking-[-.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-[var(--forest)] text-white hover:bg-[var(--fern)]", variant === "secondary" && "border border-[var(--forest)] bg-transparent text-[var(--forest)] hover:bg-[var(--mist)]", variant === "quiet" && "text-[var(--forest)] hover:bg-[var(--mist)]", variant === "danger" && "bg-[var(--error)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cn("focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold tracking-[-.01em] transition duration-200", variant === "primary" && "bg-[var(--forest)] text-white hover:bg-[var(--fern)]", variant === "secondary" && "border border-[var(--forest)] bg-transparent text-[var(--forest)] hover:bg-[var(--mist)]", variant === "quiet" && "text-[var(--forest)] hover:bg-[var(--mist)]", variant === "danger" && "bg-[var(--error)] text-white hover:bg-[#8d3e39]", className)} {...props} />;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[.13em]", tone === "neutral" && "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]", tone === "green" && "border-[#b9d7ca] bg-[#edf7f1] text-[#28634e]", tone === "amber" && "border-[#e5d0ae] bg-[#fbf3e7] text-[#8d5b24]", tone === "red" && "border-[#e8beb8] bg-[#fff0ee] text-[var(--error)]", tone === "blue" && "border-[#bfd5dc] bg-[#edf5f7] text-[var(--info)]", className)}>{children}</span>;
}

export function CountryBadge({ country }: { country: CountryCode }) {
  return <Badge tone={country === "AU" ? "green" : "blue"}>{country === "AU" ? "Australia" : "New Zealand"}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: BadgeTone = status.includes("CONFIRMED") || status === "SUCCEEDED" || status === "PUBLISHED" || status === "CONFIGURED" || status === "VERIFIED" ? "green" : status.includes("FAILED") || status === "CANCELLED" || status === "REFUNDED" || status === "ARCHIVED" || status === "MISSING" ? "red" : status.includes("PENDING") || status.includes("PROCESSING") || status === "DRAFT" ? "amber" : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function MetricCard({ label, value, detail, href }: { label: string; value: ReactNode; detail?: string; href?: string }) {
  const content = <div className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_40px_rgba(18,36,31,.04)]"><p className="eyebrow text-[var(--muted)]">{label}</p><p className="display mt-4 text-4xl text-[var(--forest)]">{value}</p>{detail ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}</div>;
  return href ? <Link className="focus-ring card-lift block rounded-[1.4rem]" href={href}>{content}</Link> : content;
}

export function Field({ label, hint, error, children, required = false, className }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  const generatedId = useId().replaceAll(":", "");
  const child = Children.only(children);
  const childProps = isValidElement(child) ? child.props as { id?: string; name?: string; "aria-describedby"?: string } : {};
  const controlId = childProps.id ?? childProps.name ?? `${generatedId}-field`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [childProps["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(child) ? cloneElement(child as ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>, { id: controlId, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined }) : child;
  return <div className={cn("space-y-2", className)}><label htmlFor={controlId} className="block text-sm font-bold text-[var(--ink)]">{label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--signal)]">*</span> : null}</label>{hint ? <p id={hintId} className="text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}{control}{error ? <p id={errorId} className="text-sm text-[var(--error)]" role="alert">{error}</p> : null}</div>;
}

export const inputClassName = "focus-ring min-h-12 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[#9aa8a3] focus:border-[var(--fern)] focus:bg-white";

export function TextInput(props: ComponentProps<"input">) { return <input className={cn(inputClassName, props.className)} {...props} />; }
export function TextArea(props: ComponentProps<"textarea">) { return <textarea className={cn(inputClassName, "min-h-32 py-3", props.className)} {...props} />; }
export function Select(props: ComponentProps<"select">) { return <select className={cn(inputClassName, "appearance-auto", props.className)} {...props} />; }

export function FormNotice({ children, tone = "error", className }: { children?: ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  if (!children) return null;
  return <div className={cn("rounded-xl border px-4 py-3 text-sm leading-6", tone === "error" && "border-[#e8beb8] bg-[#fff0ee] text-[var(--error)]", tone === "success" && "border-[#b9d7ca] bg-[#edf7f1] text-[#28634e]", tone === "info" && "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]", className)} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) { return <span className="font-bold tracking-[-.03em]">{formatMoney(amount, currency)}</span>; }

function VisualMark({ country }: { country: CountryCode }) {
  return <div aria-hidden="true" className={cn("relative h-28 overflow-hidden rounded-[1.25rem] border border-white/70", country === "AU" ? "bg-[#dcece4]" : "bg-[#e8eef2]")}><div className={cn("absolute -right-5 -top-8 h-28 w-28 rounded-full border-[14px]", country === "AU" ? "border-[#4d806c]/25" : "border-[#4e7080]/25")} /><div className={cn("absolute -bottom-12 -left-8 h-28 w-28 rounded-full", country === "AU" ? "bg-[#d97454]/45" : "bg-[#8ea9b4]/45")} /><div className="absolute inset-x-5 bottom-5 flex items-center justify-between"><span className="eyebrow text-[var(--forest)]">{country === "AU" ? "AU / FIELD NOTE" : "NZ / FIELD NOTE"}</span><span className="h-8 w-8 rounded-full border border-[var(--forest)]/30" /></div></div>;
}

export function ClassCard({ item }: { item: { slug: string; title: string; shortDescription: string; country: CountryCode; categoryName: string; presenterName?: string | null; cpdActivityCategory?: string | null; startAt: Date; timezone: string; deliveryFormat: string; priceMinorUnits: number; currency: string; remainingSeats: number | null; cpdUnitType: string; cpdUnitAmount: string | null } }) {
  const cpd = getCpdLabel(item.cpdUnitType, item.cpdUnitAmount);
  const delivery = item.deliveryFormat.replaceAll("_", " ").toLowerCase();
  return <article className="card-lift group flex h-full flex-col overflow-hidden rounded-[1.45rem] border border-[var(--line)] bg-[var(--surface)] shadow-[0_12px_40px_rgba(18,36,31,.04)]"><div className="p-3"><VisualMark country={item.country} /></div><div className="flex flex-1 flex-col p-5 pt-2 sm:p-6 sm:pt-2"><div className="flex items-start justify-between gap-4"><CountryBadge country={item.country} /><span className="text-[11px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">{delivery}</span></div><p className="mt-6 text-xs font-bold uppercase tracking-[.12em] text-[var(--fern)]">{item.categoryName}</p><h3 className="display mt-3 text-[1.7rem] leading-[1.02] text-[var(--forest)]">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{item.shortDescription}</p>{item.presenterName || item.cpdActivityCategory ? <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">{item.presenterName ? <span className="rounded-full bg-[var(--mist)] px-3 py-1.5 text-[var(--forest)]">{item.presenterName}</span> : null}{item.cpdActivityCategory ? <span className="rounded-full border border-[var(--line)] px-3 py-1.5">{item.cpdActivityCategory}</span> : null}</div> : null}<div className="mt-auto border-t border-[var(--line)] pt-5"><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[var(--muted)]"><span>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: item.timezone }).format(new Date(item.startAt))}</span>{cpd ? <span>{cpd}</span> : null}{item.remainingSeats !== null ? <span>{item.remainingSeats} seats left</span> : <span>Open capacity</span>}</div><div className="mt-4 flex items-center justify-between gap-4"><Price amount={item.priceMinorUnits} currency={item.currency} /><Link href={`/classes/${item.slug}`} className="focus-ring text-sm font-bold text-[var(--forest)] underline decoration-[var(--signal)] underline-offset-4 transition group-hover:text-[var(--fern)]">View class <span aria-hidden="true">↗</span></Link></div></div></div></article>;
}

export function EmptyState({ title, description, action, eyebrow = "Nothing here yet" }: { title: string; description: string; action?: ReactNode; eyebrow?: string }) {
  return <div className="surface-grid rounded-[1.45rem] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-14 text-center"><p className="eyebrow text-[var(--fern)]">{eyebrow}</p><h2 className="display mt-3 text-3xl text-[var(--forest)]">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">{description}</p>{action ? <div className="mt-6">{action}</div> : null}</div>;
}

export function Pagination({ page, hasNext, previousHref, nextHref }: { page: number; hasNext: boolean; previousHref: string; nextHref: string }) {
  if (page === 1 && !hasNext) return null;
  return <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5 text-sm"><div>{page > 1 ? <Link href={previousHref} className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-bold text-[var(--forest)] hover:border-[var(--forest)]">Previous</Link> : <span />}</div><span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Page {page}</span><div>{hasNext ? <Link href={nextHref} className="focus-ring rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-bold text-[var(--forest)] hover:border-[var(--forest)]">Next</Link> : <span />}</div></nav>;
}
