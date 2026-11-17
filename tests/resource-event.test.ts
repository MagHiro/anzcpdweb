import { expect, it } from "vitest";
import { resourceEventDetails } from "@/server/email/resource-event";
import { renderMessage } from "@/server/email/render";

const activity = { title: "Migration workshop", startAt: new Date("2026-11-17T03:00:00Z"), endAt: new Date("2026-11-17T05:00:00Z"), timezone: "Australia/Perth", deliveryFormat: "ONLINE", venueName: null, venueAddress: null, meetingLink: "https://zoom.us/j/123", onlineAttendanceInfo: "Passcode: 123456" };
it.each(["MATERIALS", "RECORDING", "BOTH"] as const)("includes event details in %s HTML and text", async template => {
  const details = resourceEventDetails(activity);
  const rendered = await renderMessage({ type: "RESOURCE_SHARE", classId: "class", campaignId: "campaign", template, email: "test@example.com", name: "Alex", url: "https://example.com/account/bookings", ...details });
  for (const content of [rendered.html, rendered.text]) {
    expect(content).toContain(activity.title);
    expect(content).toContain("17 Nov 2026");
    expect(content).toContain("11:00 am");
    expect(content).toContain("1:00 pm");
    expect(content).toContain("Australia/Perth");
    expect(content).toContain("Online");
    expect(content).toContain(activity.meetingLink);
    expect(content).toContain("Passcode: 123456");
  }
});
it("includes the venue address without an irrelevant meeting link for in-person events", () => {
  expect(resourceEventDetails({ ...activity, deliveryFormat: "IN_PERSON", venueName: "Academy", venueAddress: "123 High Street" })).toMatchObject({ eventLocation: "Academy, 123 High Street", meetingLink: undefined, attendanceInfo: undefined });
});
it("does not invent a missing meeting link", () => {
  expect(resourceEventDetails({ ...activity, meetingLink: null, onlineAttendanceInfo: null })).toMatchObject({ meetingLink: undefined, attendanceInfo: "The meeting link has not been added yet." });
});
