import { describe, expect, it } from "vitest";
import { classEmailSchema, uniqueClassRecipients } from "@/server/email/class-email";
import { renderMessage } from "@/server/email/render";

const data = { classId: "12345678-1234-4234-8234-123456789012", campaignId: "12345678-1234-4234-8234-123456789013", subject: "Class update", message: "First line\nSecond line <script>alert(1)</script>" };

describe("class participant emails", () => {
  it("deduplicates addresses without exposing other recipients", () => {
    expect(uniqueClassRecipients([{ email: " Alex@example.com ", fullName: "Alex Test" }, { email: "alex@EXAMPLE.com", fullName: "Alex Test" }, { email: "other@example.com", fullName: "Other Person" }])).toEqual([{ email: "alex@example.com", name: "Alex" }, { email: "other@example.com", name: "Other" }]);
  });
  it("validates limits, identifiers, blank content and header injection", () => {
    expect(classEmailSchema.safeParse(data).success).toBe(true);
    for (const patch of [{ subject: " " }, { message: " " }, { subject: "Injected\r\nBcc: other@example.com" }, { subject: "a".repeat(161) }, { message: "a".repeat(10001) }, { classId: "bad" }, { campaignId: "bad" }]) expect(classEmailSchema.safeParse({ ...data, ...patch }).success).toBe(false);
  });
  it("renders escaped plain text in the standard email layout", async () => {
    const result = await renderMessage({ type: "CLASS_EMAIL", ...data, email: "alex@example.com", name: "Alex", classTitle: "Ethics workshop" });
    expect(result.subject).toBe(data.subject);
    expect(result.html).toContain("Tahoma");
    expect(result.html).toContain("Ethics workshop");
    expect(result.html).not.toContain("<script>");
    expect(result.text).toContain("First line");
    expect(result.text).toContain("Second line");
  });
});
