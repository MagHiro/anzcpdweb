import Link from "next/link";
import { getAuditLogRows } from "@/server/catalogue/queries";

function readable(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").toLowerCase().replace(/^./, letter => letter.toUpperCase()).replace(/\bcpd\b/g, "CPD").replace(/\bid\b/g, "ID").replace(/\burl\b/g, "URL");
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "AU") return "Australia";
  if (value === "NZ") return "New Zealand";
  if (Array.isArray(value)) return value.map(displayValue).join(", ") || "None";
  if (typeof value === "object") return Object.entries(value).map(([key, entry]) => `${readable(key)}: ${displayValue(entry)}`).join("; ");
  return String(value);
}

function recordHref(type: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return undefined;
  if (type === "class") return `/admin/classes/${id}`;
  if (type === "booking") return `/admin/bookings/${id}`;
  return undefined;
}

export default async function AdminAuditLogPage() {
  const rows = await getAuditLogRows();
  return <div>
    <div className="admin-page-heading"><h1 className="display">Audit log</h1></div>
    <div className="audit-activity-list mt-8">
      {!rows.length && <p className="p-8 text-sm text-[var(--muted)]">No audit events to display.</p>}
      {rows.map(({ audit, actorName }) => {
        const metadata = audit.metadata && typeof audit.metadata === "object" && !Array.isArray(audit.metadata) ? audit.metadata as Record<string, unknown> : {};
        const title = typeof metadata.title === "string" ? metadata.title : typeof metadata.name === "string" ? metadata.name : undefined;
        const href = recordHref(audit.entityType, audit.entityId);
        return <article key={audit.id} className="audit-activity-row">
          <div className="audit-activity-header"><div><h2>{readable(audit.action)}</h2><p className="audit-activity-actor">{actorName ?? "System"}{title && <> · <span>{title}</span></>}</p></div><time dateTime={audit.createdAt.toISOString()}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(audit.createdAt)}</time></div>
          {Object.keys(metadata).length > 0 && <details className="audit-event-details"><summary className="focus-ring">Event details</summary><dl className="audit-metadata">{Object.entries(metadata).map(([key, value]) => <div key={key}><dt>{key === "count" && audit.action === "CLASS_SOURCE_REFERENCES_UPDATED" ? "Attached references" : readable(key)}</dt><dd>{displayValue(value)}</dd></div>)}</dl></details>}
          <div className="audit-event-footer">{href && <Link href={href} className="focus-ring">View {audit.entityType} →</Link>}<details className="audit-technical"><summary className="focus-ring">Technical details</summary><dl className="audit-metadata"><div><dt>Record type</dt><dd>{readable(audit.entityType)}</dd></div><div><dt>Record ID</dt><dd>{audit.entityId}</dd></div><div><dt>Event ID</dt><dd>{audit.id}</dd></div><div><dt>Action</dt><dd>{audit.action}</dd></div></dl>{audit.metadata !== null && <pre>{JSON.stringify(audit.metadata, null, 2)}</pre>}</details></div>
        </article>;
      })}
    </div>
  </div>;
}
