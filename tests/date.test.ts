import { expect, it } from "vitest";
import { parseLocalDateTime, toDateTimeLocalValue } from "@/lib/date";

it("interprets editor times in the selected timezone instead of the server timezone", () => {
  expect(parseLocalDateTime("2026-12-17T20:00", "Australia/Melbourne").toISOString()).toBe("2026-12-17T09:00:00.000Z");
  for (const zone of ["Australia/Melbourne", "Pacific/Auckland", "Australia/Perth"]) {
    const input = "2026-12-17T20:00";
    expect(toDateTimeLocalValue(parseLocalDateTime(input, zone), zone)).toBe(input);
  }
});
it("rejects invalid and daylight-saving skipped local times", () => {
  expect(() => parseLocalDateTime("2026-10-04T02:30", "Australia/Melbourne")).toThrow();
  expect(() => parseLocalDateTime("2026-02-30T12:00", "Australia/Melbourne")).toThrow();
});
