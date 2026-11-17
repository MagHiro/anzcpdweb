import { EmailLayout, EmailText } from "./_components/layout";
import type { ClassEmailMessage } from "@/server/email/class-email";

export default function ClassEmail({ name, subject, classTitle, message }: ClassEmailMessage) {
  return <EmailLayout title={subject} name={name}>
    <EmailText style={{ color: "#52645b" }}>{classTitle}</EmailText>
    {message.split(/\r?\n/).map((line, index) => <EmailText key={index} style={{ marginBottom: "8px", overflowWrap: "anywhere" }}>{line || <br />}</EmailText>)}
  </EmailLayout>;
}
