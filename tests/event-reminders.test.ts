import { describe, expect, it } from "vitest";
import { reminderIsDue, type EventReminderMessage } from "@/server/email/reminders";
import { renderMessage } from "@/server/email/render";

const message: EventReminderMessage = {
  type: "EVENT_REMINDER", bookingId: "example", eventStartAt: "2026-11-24T11:00:00Z", daysBefore: 3,
  email: "alex@example.com", name: "Alex Smith", classTitle: "Migration practice", classDate: "Tuesday, 24 November 2026",
  classTime: "7:00 pm GMT+08:00 (Asia/Singapore)", deliveryFormat: "ONLINE", meetingLink: "https://zoom.us/j/123",
};

describe("event reminder timing and template", () => {
  it.each([1, 3] as const)("sends the %s-day reminder at the event time with one hour of recovery", days => {
    const start = new Date(message.eventStartAt);
    const due = start.getTime() - days * 86400000;
    expect(reminderIsDue(start, days, new Date(due - 1))).toBe(false);
    expect(reminderIsDue(start, days, new Date(due))).toBe(true);
    expect(reminderIsDue(start, days, new Date(due + 3599999))).toBe(true);
    expect(reminderIsDue(start, days, new Date(due + 3600000))).toBe(false);
    expect(reminderIsDue(start, days, start)).toBe(false);
  });
  it("uses first name, event details, bold substitutions and the online joining link", async () => {
    const result = await renderMessage(message);
    expect(result.text).toContain("Dear Alex,");
    expect(result.text).not.toContain("Alex Smith");
    expect(result.text).toContain("in 3 days");
    expect(result.text).toContain(message.classDate);
    expect(result.text).toContain(message.classTime);
    expect(result.text).toContain(message.meetingLink);
    expect(result.html).toContain("<strong>Migration practice</strong>");
    expect(result.text).toContain("ANZ Migrate");
    expect(result.html).toContain("font-size:14px");
    expect(result.html).toContain("Tahoma");
  });
  it("uses tomorrow and replaces online instructions with venue details for in-person events", async () => {
    const result = await renderMessage({ ...message, daysBefore: 1, deliveryFormat: "IN_PERSON", venueName: "Academy Hall", venueAddress: "12 Example Street, Sydney" });
    expect(result.text).toContain("tomorrow");
    expect(result.text).toContain("Academy Hall, 12 Example Street, Sydney");
    expect(result.text).not.toContain("Zoom");
    expect(result.text).not.toContain(message.meetingLink);
    expect(result.text).not.toContain("webinar");
  });
  it("includes both attendance options for hybrid events", async () => {
    const result = await renderMessage({ ...message, deliveryFormat: "HYBRID", venueAddress: "12 Example Street" });
    expect(result.text).toContain(message.meetingLink);
    expect(result.text).toContain("12 Example Street");
  });
});
