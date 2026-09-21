import Link from "next/link";
import { Children, cloneElement, isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import type { CountryCode } from "@/db/schema";
import { cn, formatMoney } from "@/lib/utils";
import { getCpdLabel } from "@/lib/domain/countries";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12", className)} {...props} />;
}

export function Section({ className, children, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-16 sm:py-24", className)} {...props}>{children}</section>;
}

export function Button({ className, variant = "primary", ...props }: ComponentProps<"button"> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  return <button className={cn("focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-[var(--forest)] text-white hover:bg-[var(--fern)]", variant === "secondary" && "border border-[var(--forest)] text-[var(--forest)] hover:bg-[var(--mist)]", variant === "quiet" && "text-[var(--forest)] hover:bg-[var(--mist)]", variant === "danger" && "bg-[var(--error)] text-white hover:bg-[#7f2d27]", className)} {...props} />;
}

export function LinkButton({ className, variant = "primary", ...props }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "quiet" | "danger" }) {
  return <Link className={cn("focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition duration-200", variant === "primary" && "bg-[var(--forest)] text-white hover:bg-[var(--fern)]", variant === "secondary" && "border border-[var(--forest)] text-[var(--forest)] hover:bg-[var(--mist)]", variant === "quiet" && "text-[var(--forest)] hover:bg-[var(--mist)]", variant === "danger" && "bg-[var(--error)] text-white hover:bg-[#7f2d27]", className)} {...props} />;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red"; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em]", tone === "neutral" && "border-[var(--line)] bg-white text-[var(--muted)]", tone === "green" && "border-[#bdd9cc] bg-[#edf7f1] text-[#21604b]", tone === "amber" && "border-[#e8d2af] bg-[#fbf2e6] text-[#85551e]", tone === "red" && "border-[#e8bbb6] bg-[#fff0ee] text-[var(--error)]", className)}>{children}</span>;
}

export function CountryBadge({ country }: { country: CountryCode }) {
  return <Badge tone={country === "AU" ? "green" : "amber"}>{country === "AU" ? "Australia" : "New Zealand"}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status.includes("CONFIRMED") || status === "SUCCEEDED" || status === "PUBLISHED" ? "green" : status.includes("FAILED") || status === "CANCELLED" || status === "REFUNDED" || status === "ARCHIVED" ? "red" : status.includes("PENDING") || status.includes("PROCESSING") || status === "DRAFT" ? "amber" : "neutral";
  return <Badge tone={tone}>{status.replaceAll("_", " ")}</Badge>;
}

export function Field({ label, hint, error, children, required = false, className }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean; className?: string }) {
  const generatedId = useId().replaceAll(":", "");
  const child = Children.only(children);
  const childProps = isValidElement(child) ? child.props as { id?: string; name?: string; "aria-describedby"?: string } : {};
  const controlId = childProps.id ?? childProps.name ?? `${generatedId}-field`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [childProps["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(child)
    ? cloneElement(child as ReactElement<{ id?: string; "aria-describedby"?: string }>, { id: controlId, "aria-describedby": describedBy })
    : child;
  return <div className={cn("space-y-2", className)}><label htmlFor={controlId} className="block text-sm font-bold text-[var(--ink)]">{label}{required ? <span aria-hidden="true" className="ml-1 text-[var(--ochre)]">*</span> : null}</label>{hint ? <p id={hintId} className="text-xs leading-5 text-[var(--muted)]">{hint}</p> : null}{control}{error ? <p id={errorId} className="text-sm text-[var(--error)]" role="alert">{error}</p> : null}</div>;
}

export const inputClassName = "focus-ring min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 text-sm text-[var(--ink)] outline-none transition placeholder:text-[#97a39f] focus:border-[var(--fern)]";

export function TextInput(props: ComponentProps<"input">) { return <input className={cn(inputClassName, props.className)} {...props} />; }
export function TextArea(props: ComponentProps<"textarea">) { return <textarea className={cn(inputClassName, "min-h-32 py-3", props.className)} {...props} />; }
export function Select(props: ComponentProps<"select">) { return <select className={cn(inputClassName, "appearance-auto", props.className)} {...props} />; }

export function FormNotice({ children, tone = "error", className }: { children?: ReactNode; tone?: "error" | "success" | "info"; className?: string }) {
  if (!children) return null;
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", tone === "error" && "border-[#e8bbb6] bg-[#fff0ee] text-[var(--error)]", tone === "success" && "border-[#bdd9cc] bg-[#edf7f1] text-[#21604b]", tone === "info" && "border-[var(--line)] bg-white text-[var(--muted)]", className)} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function Price({ amount, currency }: { amount: number; currency: string }) { return <span className="font-bold tracking-tight">{formatMoney(amount, currency)}</span>; }

export function ClassCard({ item }: { item: { slug: string; title: string; shortDescription: string; country: CountryCode; categoryName: string; presenterName?: string | null; cpdActivityCategory?: string | null; startAt: Date; timezone: string; deliveryFormat: string; priceMinorUnits: number; currency: string; remainingSeats: number | null; cpdUnitType: string; cpdUnitAmount: string | null } }) {
  const cpd = getCpdLabel(item.cpdUnitType, item.cpdUnitAmount);
  return <article className="group flex h-full flex-col rounded-[1.6rem] border border-[var(--line)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#a9c7bd] hover:shadow-[0_18px_50px_rgba(23,60,55,.09)] sm:p-6"><div className="flex items-start justify-between gap-4"><CountryBadge country={item.country} /><span className="text-xs font-semibold text-[var(--muted)]">{item.deliveryFormat.replaceAll("_", " ").toLowerCase()}</span></div><p className="mt-8 text-xs font-bold uppercase tracking-[.1em] text-[var(--fern)]">{item.categoryName}</p><h3 className="display mt-3 text-2xl leading-tight text-[var(--forest)]">{item.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">{item.shortDescription}</p>{item.presenterName || item.cpdActivityCategory ? <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[var(--muted)]">{item.presenterName ? <span className="rounded-full bg-[var(--mist)] px-3 py-1.5 text-[var(--forest)]">{item.presenterName}</span> : null}{item.cpdActivityCategory ? <span className="rounded-full border border-[var(--line)] px-3 py-1.5">{item.cpdActivityCategory}</span> : null}</div> : null}<div className="mt-auto border-t border-[var(--line)] pt-5"><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[var(--muted)]"><span>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: item.timezone }).format(new Date(item.startAt))}</span>{cpd ? <span>{cpd}</span> : null}{item.remainingSeats !== null ? <span>{item.remainingSeats} seats left</span> : <span>Open capacity</span>}</div><div className="mt-4 flex items-center justify-between gap-4"><Price amount={item.priceMinorUnits} currency={item.currency} /><Link href={`/classes/${item.slug}`} className="focus-ring text-sm font-bold text-[var(--forest)] underline decoration-[#a9c7bd] underline-offset-4 transition group-hover:text-[var(--fern)]">View class</Link></div></div></article>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="rounded-[1.5rem] border border-dashed border-[var(--line)] bg-white px-6 py-12 text-center"><h2 className="display text-2xl text-[var(--forest)]">{title}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">{description}</p>{action ? <div className="mt-6">{action}</div> : null}</div>; }

export function Pagination({ page, hasNext, previousHref, nextHref }: { page: number; hasNext: boolean; previousHref: string; nextHref: string }) { if (page === 1 && !hasNext) return null; return <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4 text-sm"><div>{page > 1 ? <Link href={previousHref} className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 font-bold text-[var(--forest)]">Previous</Link> : <span />}</div><span className="text-[var(--muted)]">Page {page}</span><div>{hasNext ? <Link href={nextHref} className="focus-ring rounded-full border border-[var(--line)] px-4 py-2 font-bold text-[var(--forest)]">Next</Link> : <span />}</div></nav>; }
