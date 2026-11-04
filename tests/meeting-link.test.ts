import { describe, expect, it } from "vitest";
import { classFormSchema } from "@/lib/validation";

const meetingLinkSchema = classFormSchema.shape.meetingLink;

describe("class meeting link", () => {
  it.each([undefined, "", "https://zoom.us/j/123?pwd=secret", "http://meet.example.com/class"])("accepts an optional HTTP(S) URL: %s", value => {
    expect(meetingLinkSchema.safeParse(value).success).toBe(true);
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "ftp://example.com", "not a url", `https://example.com/${"a".repeat(2000)}`])("rejects invalid or unsafe URLs: %s", value => {
    expect(meetingLinkSchema.safeParse(value).success).toBe(false);
  });
});
