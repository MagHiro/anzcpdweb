import { z } from "zod";

export const classEmailSchema = z.object({
  classId: z.uuid(),
  campaignId: z.uuid(),
  template: z.enum(["MATERIALS", "RECORDING", "BOTH"]),
}).strict();

export type ResourceTemplate = z.infer<typeof classEmailSchema>["template"];
export const resourceTemplateLabels: Record<ResourceTemplate, string> = { MATERIALS: "Materials", RECORDING: "Recording", BOTH: "Materials & recording" };
export function resourceTemplateReady(template: ResourceTemplate, ready: { materials: boolean; recording: boolean }) {
  return (template === "RECORDING" || ready.materials) && (template === "MATERIALS" || ready.recording);
}

export type ClassEmailMessage = {
  type: "RESOURCE_SHARE";
  classId: string;
  campaignId: string;
  classTitle: string;
  email: string;
  name: string;
  template: ResourceTemplate;
  url: string;
  eventDate?: string;
  eventLocation?: string;
  meetingLink?: string;
  attendanceInfo?: string;
};

export function uniqueClassRecipients<T extends { email: string; fullName: string }>(participants: T[]) {
  return [...new Map(participants.map(participant => [participant.email.trim().toLowerCase(), participant])).entries()]
    .map(([email, participant]) => ({ email, name: participant.fullName.split(" ")[0] || participant.fullName }));
}
