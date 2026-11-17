import { describe, expect, it } from "vitest";
import { classEmailSchema, resourceTemplateReady, uniqueClassRecipients } from "@/server/email/class-email";
import { renderMessage } from "@/server/email/render";

const data = { classId: "12345678-1234-4234-8234-123456789012", campaignId: "12345678-1234-4234-8234-123456789013", template: "MATERIALS" as const };

describe("class participant emails", () => {
  it("deduplicates addresses without exposing other recipients", () => {
    expect(uniqueClassRecipients([{ email: " Alex@example.com ", fullName: "Alex Test" }, { email: "alex@EXAMPLE.com", fullName: "Alex Test" }, { email: "other@example.com", fullName: "Other Person" }])).toEqual([{ email: "alex@example.com", name: "Alex" }, { email: "other@example.com", name: "Other" }]);
  });
  it("rejects custom content, invalid templates and identifiers", () => {
    expect(classEmailSchema.safeParse(data).success).toBe(true);
    for (const patch of [{ subject: "Custom" }, { message: "Custom" }, { template: "CUSTOM" }, { classId: "bad" }, { campaignId: "bad" }]) expect(classEmailSchema.safeParse({ ...data, ...patch }).success).toBe(false);
  });
  it.each(["MATERIALS", "RECORDING", "BOTH"] as const)("renders the %s template with protected account access", async template => {
    const result = await renderMessage({ type: "RESOURCE_SHARE", ...data, template, url: "https://example.com/account/bookings", email: "alex@example.com", name: "Alex", classTitle: "Ethics workshop <script>" });
    expect(result.subject).toContain("ready:");
    expect(result.html).toContain("Tahoma");
    expect(result.html).toContain("Ethics workshop");
    expect(result.html).not.toContain("<script>");
    expect(result.text).toContain("Sign in to your account");
    expect(result.html).toContain("https://example.com/account/bookings");
    expect(result.text).toContain(template === "MATERIALS" ? "The materials are" : template === "RECORDING" ? "The recording is" : "The materials and recording are");
  });
  it("requires exactly the resources each template shares", () => {
    for (const materials of [false, true]) for (const recording of [false, true]) {
      expect(resourceTemplateReady("MATERIALS", { materials, recording })).toBe(materials);
      expect(resourceTemplateReady("RECORDING", { materials, recording })).toBe(recording);
      expect(resourceTemplateReady("BOTH", { materials, recording })).toBe(materials && recording);
    }
  });
});
