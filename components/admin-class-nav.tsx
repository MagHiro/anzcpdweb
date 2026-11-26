import Link from "next/link";

export function AdminClassNav({ classId, current }: { classId: string; current: "details" | "participants" | "resources" | "promos" }) {
  return <nav aria-label="Class workspace" className="admin-record-tabs">
    {([
      ["details", "Class details", `/admin/classes/${classId}`],
      ["participants", "Participants", `/admin/classes/${classId}/participants`],
      ["resources", "Materials & recordings", `/admin/classes/${classId}/resources`],
      ["promos", "Promo codes", `/admin/classes/${classId}/promos`],
    ] as const).map(([key, label, href]) => <Link key={key} href={href} aria-current={current === key ? "page" : undefined} className="focus-ring">{label}</Link>)}
  </nav>;
}
