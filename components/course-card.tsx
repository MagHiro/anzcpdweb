import Link from "next/link";
import type { CpdCourse } from "@/lib/domain/cpd";
import { cn } from "@/lib/utils";

const categoryStyles = {
  "Category A": "border-[#f3c5b2] bg-[#fff4ef] text-[#a7472b]",
  "Category B": "border-[#c4d8e9] bg-[#f1f7fb] text-[#2d617d]",
};

export function CourseCard({ course, className }: { course: CpdCourse; className?: string }) {
  return (
    <article className={cn("group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#9bbcb1] hover:shadow-[0_18px_55px_rgba(23,60,55,.10)]", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[.13em]", categoryStyles[course.category])}>{course.category}</span>
        <span className={cn("text-[10px] font-bold uppercase tracking-[.12em]", course.status === "Open" ? "text-[var(--fern)]" : "text-[var(--muted)]")}>{course.status}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">{course.type}</p>
        <h3 className="display mt-3 text-[1.65rem] leading-[1.05] text-[var(--forest)]">{course.title}</h3>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{course.description}</p>
        <div className="mt-6 grid grid-cols-2 gap-y-4 border-y border-[var(--line)] py-5 text-xs">
          <div><p className="font-bold uppercase tracking-[.1em] text-[var(--muted)]">When</p><p className="mt-1 font-semibold text-[var(--ink)]">{course.date}</p></div>
          <div><p className="font-bold uppercase tracking-[.1em] text-[var(--muted)]">Value</p><p className="mt-1 font-semibold text-[var(--forest)]">{course.points}</p></div>
          <div><p className="font-bold uppercase tracking-[.1em] text-[var(--muted)]">Time</p><p className="mt-1 font-semibold text-[var(--ink)]">{course.hours}</p></div>
          <div><p className="font-bold uppercase tracking-[.1em] text-[var(--muted)]">Country</p><p className="mt-1 font-semibold text-[var(--ink)]">{course.country}</p></div>
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Presenter</p><Link href={`/presenters/${course.presenterSlug}`} className="focus-ring mt-1 inline-block text-sm font-bold text-[var(--forest)] underline decoration-[#a9c7bd] underline-offset-4 hover:text-[var(--fern)]">{course.presenterName}</Link></div>
          <Link href={`/courses/${course.slug}`} className="focus-ring shrink-0 rounded-full bg-[var(--forest)] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--fern)]">View activity</Link>
        </div>
      </div>
    </article>
  );
}

export function CourseListMeta({ course }: { course: CpdCourse }) {
  return <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--muted)]"><span>{course.date}</span><span>{course.hours}</span><span className="text-[var(--forest)]">{course.points}</span><span>{course.format}</span></div>;
}
