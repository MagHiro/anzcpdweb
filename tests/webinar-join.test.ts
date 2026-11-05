import { describe, expect, it } from "vitest";
import { webinarJoinState } from "@/server/bookings/join";

const event = { bookingStatus: "CONFIRMED", classStatus: "PUBLISHED", deliveryFormat: "ONLINE", meetingLink: "https://zoom.us/j/123", startAt: new Date("2026-11-17T00:00:00Z"), endAt: new Date("2026-11-17T01:00:00Z"), timezone: "Pacific/Auckland" };

describe("webinar join access", () => {
  it("allows joining before the event date and until the event ends", () => {
    expect(webinarJoinState(event, new Date("2026-11-01T10:00:00Z"))).toBe("available");
    expect(webinarJoinState(event, new Date("2026-11-16T10:59:59Z"))).toBe("available");
    expect(webinarJoinState(event, new Date("2026-11-16T11:00:00Z"))).toBe("available");
    expect(webinarJoinState(event, event.startAt)).toBe("available");
    expect(webinarJoinState(event, event.endAt)).toBe("ended");
  });
  it.each(["PENDING_PAYMENT", "CANCELLED", "REFUNDED", "EXPIRED"])("hides joining for %s bookings", bookingStatus => {
    expect(webinarJoinState({ ...event, bookingStatus }, event.startAt)).toBe("hidden");
  });
  it("hides in-person and cancelled events, but supports hybrid and partially refunded bookings", () => {
    expect(webinarJoinState({ ...event, deliveryFormat: "IN_PERSON" }, event.startAt)).toBe("hidden");
    expect(webinarJoinState({ ...event, classStatus: "CANCELLED" }, event.startAt)).toBe("hidden");
    expect(webinarJoinState({ ...event, deliveryFormat: "HYBRID", bookingStatus: "PARTIALLY_REFUNDED" }, event.startAt)).toBe("available");
  });
  it.each([null, "javascript:alert(1)", "invalid"])("disables joining without a valid HTTP(S) link: %s", meetingLink => {
    expect(webinarJoinState({ ...event, meetingLink }, event.startAt)).toBe("missing");
  });
});
