import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
export const metadata: Metadata = { title: "Complaints procedure | Administration", robots: { index: false, follow: false } };
const tasks = [
  { title: "First contact", text: "Discuss the concern with the client. Resolve misunderstandings where possible; otherwise direct them to make a formal written complaint." },
  { title: "Log the written complaint", text: "Check the heading includes “Complaint”, the main applicant’s name and date of birth, the specific concern, full details and any supporting documents." },
  { title: "Acknowledge", text: "Send a written acknowledgement within 3 business days of receiving the formal complaint." },
  { title: "Investigate and respond", text: "Within 5 business days of acknowledgement, explain the concern and proposed resolution/timing, or state that additional research is needed and give an estimated timeframe." },
  { title: "Confirm the outcome", text: "Invite an in-person meeting if requested. Ask the client to confirm resolution within 5 business days of the provider’s response." },
  { title: "Close or agree next actions", text: "Close if satisfied with no action required or if no response is received. If actions are agreed, set a timeframe, complete them, and jointly review within 5 business days of final action. Record written agreement before formal closure." },
  { title: "Reopen the investigation", text: "If dissatisfied with the response or actions, repeat the investigation-and-response step." },
  { title: "Escalate where required", text: "Seek mediation under Victorian consumer practices if the parties cannot agree, splitting costs equally. Consumer Affairs Victoria offers guidance. With all parties’ agreement, use another jurisdiction. If unsuccessful 28 days after referral (or later by agreement), the dispute may proceed to VCAT." },
];
export default function AdminComplaintsPage() {
  return <div><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm font-semibold text-[var(--fern)]">Operations / Complaints</p><h1 className="display mt-4 text-[2.8rem] font-semibold text-[var(--forest)]">Complaints playbook</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">A staff-facing reference for following the academy’s CPD complaint management procedure, version 1.1.</p></div><LinkButton href="/complaints/procedure" variant="secondary">View public procedure ↗</LinkButton></div>
    <div className="mt-9 grid gap-5 sm:grid-cols-3">{[["03", "Business days to acknowledge"],["05", "Business days to initial response"],["28", "Days after mediation referral"]].map(([value,label])=><div key={label} className="metric-tile rounded-[1.3rem] bg-white p-7"><p className="text-[3.2rem] font-semibold leading-none tracking-[-.07em] text-[var(--forest)]">{value}</p><p className="mt-4 text-sm text-[var(--muted)]">{label}</p></div>)}</div>
    <section className="mt-12"><h2 className="text-2xl font-semibold tracking-[-.035em]">Procedure checklist</h2><div className="mt-7 grid gap-4 lg:grid-cols-2">{tasks.map((task,i)=><div key={task.title} className="rounded-[1.2rem] bg-white p-7 shadow-[var(--shadow-soft)]"><div className="flex items-center gap-4"><span className="text-xl font-semibold text-[#7da181]">{String(i+1).padStart(2,"0")}</span><h3 className="text-lg font-semibold">{task.title}</h3></div><p className="mt-4 text-sm leading-7 text-[var(--muted)]">{task.text}</p></div>)}</div></section>
    <div className="mt-9 rounded-[1.4rem] bg-[#e9efe1] p-7"><h2 className="text-lg font-semibold">Case records</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">This page is a procedural reference, not a live complaint register. Do not enter or store personal complaint information here. Use the academy’s authorised correspondence and records process for each case.</p><p className="mt-4 text-sm"><Link href="/complaints/lodge" className="font-semibold text-[var(--forest)] underline underline-offset-4">How clients submit complaints ↗</Link></p></div>
  </div>;
}
