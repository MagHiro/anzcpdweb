import { z } from "zod";

export const classEmailSchema = z.object({
  classId: z.uuid(),
  campaignId: z.uuid(),
  subject: z.string().trim().min(1).max(160).refine(value => !/[\r\n]/.test(value), "Subject must be one line."),
  message: z.string().trim().min(1).max(10_000),
});

export type ClassEmailMessage = {
  type: "CLASS_EMAIL";
  classId: string;
  campaignId: string;
  classTitle: string;
  email: string;
  name: string;
  subject: string;
  message: string;
};

export function uniqueClassRecipients<T extends { email: string; fullName: string }>(participants: T[]) {
  return [...new Map(participants.map(participant => [participant.email.trim().toLowerCase(), participant])).entries()]
    .map(([email, participant]) => ({ email, name: participant.fullName.split(" ")[0] || participant.fullName }));
}
