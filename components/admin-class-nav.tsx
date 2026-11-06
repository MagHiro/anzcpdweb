import Link from "next/link";

export function AdminClassNav({ classId, current }: { classId: string; current: "details" | "participants" | "resources" }) {
  return <nav aria-label="Class workspace" className="my-6 flex flex-wrap gap-2">
    {([
      ["details", "Class details", `/admin/classes/${classId}`],
      ["participants", "Participants", `/admin/classes/${classId}/participants`],
      ["resources", "Materials & recordings", `/admin/classes/${classId}/resources`],
    ] as const).map(([key, label, href]) => <Link key={key} href={href} aria-current={current === key ? "page" : undefined} className={`focus-ring rounded-full px-5 py-3 text-sm ${current === key ? "bg-[var(--forest)] text-white" : "text-[var(--forest)] hover:bg-[var(--mint)]"}`}>{label}</Link>)}
  </nav>;
}
