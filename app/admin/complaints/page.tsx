import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { AdminPageHeading } from "@/components/admin-page-heading";
import { ArrowUpRight } from "@/components/icon";
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
  return <div>
    <AdminPageHeading title="Complaints procedure" description="Version 1.1" actions={<LinkButton href="/complaints/procedure" variant="secondary">Public procedure <ArrowUpRight size={16} /></LinkButton>} />
    <div className="admin-procedure-layout">
      <section><h2>Steps for staff</h2><ol>{tasks.map((task, i) => <li key={task.title}><span aria-hidden="true">{i + 1}</span><div><h3>{task.title}</h3><p>{task.text}</p></div></li>)}</ol></section>
      <aside><h2>Case records</h2><p>This page is not a complaint register. Keep personal complaint information in the academy’s approved correspondence and records system.</p><Link href="/complaints/lodge" className="ink-link focus-ring">How clients submit complaints</Link></aside>
    </div>
  </div>;
}
