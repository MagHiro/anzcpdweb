import { EmailLayout, EmailText } from "./_components/layout";
import type { ClassEmailMessage } from "@/server/email/class-email";
import { resourceTemplateLabels } from "@/server/email/class-email";

export default function ClassEmail({ name, template, classTitle, url, eventDate, eventLocation, meetingLink, attendanceInfo }: ClassEmailMessage) {
  const description = template === "MATERIALS" ? "The materials are" : template === "RECORDING" ? "The recording is" : "The materials and recording are";
  return <EmailLayout title={`${resourceTemplateLabels[template]} ready`} name={name} href={url} action="View class resources">
    <EmailText><strong>{classTitle}</strong></EmailText>
    {eventDate && <EmailText><strong>Date &amp; time:</strong> {eventDate}</EmailText>}
    {eventLocation && <EmailText><strong>Location:</strong> {eventLocation}</EmailText>}
    {meetingLink && <EmailText><strong>Meeting link:</strong> <a href={meetingLink}>{meetingLink}</a></EmailText>}
    {attendanceInfo && <EmailText style={{ whiteSpace: "pre-line" }}>{attendanceInfo}</EmailText>}
    <EmailText>{description} now available. Sign in to your account to access your class resources.</EmailText>
    {template !== "RECORDING" && <EmailText>The class materials are attached to this email as PDFs.</EmailText>}
  </EmailLayout>;
}
