import { formatDateTime } from "@/lib/utils";

export function resourceEventDetails(activity: {
  title: string; startAt: Date; endAt: Date; timezone: string; deliveryFormat: string;
  venueName: string | null; venueAddress: string | null; meetingLink: string | null; onlineAttendanceInfo: string | null;
}) {
  const online = activity.deliveryFormat === "ONLINE";
  const meetingLink = activity.meetingLink && /^https:\/\//i.test(activity.meetingLink) ? activity.meetingLink : undefined;
  return {
    classTitle: activity.title,
    eventDate: `${formatDateTime(activity.startAt, activity.timezone)} – ${formatDateTime(activity.endAt, activity.timezone)} (${activity.timezone})`,
    eventLocation: online ? "Online" : [activity.venueName, activity.venueAddress].filter(Boolean).join(", ") || "Venue details to be confirmed",
    meetingLink: online ? meetingLink : undefined,
    attendanceInfo: online ? activity.onlineAttendanceInfo || (!meetingLink ? "The meeting link has not been added yet." : undefined) : undefined,
  };
}
