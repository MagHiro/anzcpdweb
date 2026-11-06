"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormNotice } from "@/components/ui";

export function AdminParticipantControls({ bookingId, attendance, started, reminderDays }: { bookingId: string; attendance: string; started: boolean; reminderDays?: 1 | 3 }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  async function update(body: object) {
    setBusy(true); setError(undefined); setSuccess(undefined);
    try {
      const response = await fetch("/api/admin/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, bookingId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Update failed.");
      setSuccess("action" in body && body.action === "reminder" ? "Reminder queued." : "Attendance saved.");
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Update failed."); }
    finally { setBusy(false); }
  }
  return <div className="min-w-40 space-y-2">
    {started ? <select aria-label="Attendance" value={attendance} disabled={busy} onChange={event => update({ action: "attendance", attendance: event.target.value })} className="focus-ring min-h-10 w-full rounded-xl bg-[var(--mist)] px-3 text-sm"><option value="NOT_RECORDED">Not recorded</option><option value="ATTENDED">Attended</option><option value="ABSENT">Absent</option></select> : <span className="block text-xs text-[var(--muted)]">Attendance opens at class start</span>}
    {reminderDays && <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Resend the ${reminderDays}-day reminder to this participant now?`)) void update({ action: "reminder", daysBefore: reminderDays }); }} className="focus-ring text-xs underline underline-offset-4">Resend {reminderDays}-day reminder</button>}
    <FormNotice>{error}</FormNotice><FormNotice tone="success">{success}</FormNotice>
  </div>;
}
