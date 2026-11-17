import { EmailLayout, EmailText } from "./_components/layout";
import type { ClassEmailMessage } from "@/server/email/class-email";
import { resourceTemplateLabels } from "@/server/email/class-email";

export default function ClassEmail({ name, template, classTitle, url }: ClassEmailMessage) {
  const description = template === "MATERIALS" ? "The materials are" : template === "RECORDING" ? "The recording is" : "The materials and recording are";
  return <EmailLayout title={`${resourceTemplateLabels[template]} ready`} name={name} href={url} action="View class resources">
    <EmailText><strong>{classTitle}</strong></EmailText>
    <EmailText>{description} now available. Sign in to your account to access your class resources.</EmailText>
    {template !== "RECORDING" && <EmailText>The class materials are attached to this email as PDFs.</EmailText>}
  </EmailLayout>;
}
