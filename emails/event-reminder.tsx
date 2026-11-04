import { EmailLayout, EmailText as Text } from "./_components/layout";
import type { EventReminderMessage } from "../server/email/reminders";

export default function EventReminder(message: EventReminderMessage) {
  const online = message.deliveryFormat !== "IN_PERSON";
  const event = online ? "webinar" : "event";
  return <EmailLayout title={`${message.classTitle} — ${message.daysBefore === 1 ? "tomorrow" : "in 3 days"}`} name={message.name.trim().split(/\s+/)[0]} salutation="Dear">
    <Text>Just a quick reminder that our <strong>{message.classTitle}</strong> {event} is happening <strong>{message.daysBefore === 1 ? "tomorrow" : "in 3 days"}</strong>!</Text>
    <Text>📅 Date: <strong>{message.classDate}</strong><br />⏰ Time: <strong>{message.classTime}</strong></Text>
    {online && message.meetingLink && <><Text>You may use the link provided below to access the webinar.</Text><Text>🔗 Join the webinar here: <a href={message.meetingLink}>{new URL(message.meetingLink).hostname.endsWith("zoom.us") ? "Zoom" : "Join webinar"}</a></Text></>}
    {message.deliveryFormat !== "ONLINE" && <Text>📍 Venue: <strong>{[message.venueName, message.venueAddress].filter(Boolean).join(", ")}</strong></Text>}
    {online && !message.meetingLink && <Text>Please refer to your booking confirmation for attendance details.</Text>}
    <Text>We are more than happy to get the conversations going with you. Just send your details in a reply to this email and we will get in touch with you immediately after the {event}.</Text>
    <Text>Don&apos;t miss out!</Text><Text>Best regards,<br />ANZ Migrate</Text>
  </EmailLayout>;
}
