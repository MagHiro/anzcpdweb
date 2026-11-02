import { describe, expect, it } from "vitest";
import { renderMessage } from "../server/email/render";
import type { EmailMessage } from "../server/email/service";

const base = { email: "alex@example.com", name: "Alex <script>alert(1)</script>" };
const url = "https://example.com/private?token=sample&next=booking";
const messages: EmailMessage[] = [
  { ...base, type: "EMAIL_VERIFICATION", url },
  { ...base, type: "PASSWORD_RESET", url },
  { ...base, type: "ACCOUNT_SETUP", url },
  { ...base, type: "ACCOUNT_CLAIM", url },
  { ...base, type: "PAYMENT_RECEIPT", url, receiptNumber: "R-123", classTitle: "Ethics & practice", amount: "AUD 120.00" },
  { ...base, type: "BOOKING_CONFIRMATION", detailUrl: url, bookingReference: "B-123", classTitle: "Ethics & practice", classDate: "30 November 2026", amount: "AUD 120.00" },
  { ...base, type: "BOOKING_CANCELLED", detailUrl: url, bookingReference: "B-123", classTitle: "Ethics & practice", reason: "Class cancelled; refunds are handled separately." },
  { ...base, type: "REFUND_STATUS", detailUrl: url, bookingReference: "B-123", amount: "AUD 120.00", status: "succeeded" },
];

describe("React Email templates", () => {
  it("includes password reset safety instructions", async () => {
    const result = await renderMessage(messages[1]);
    expect(result.text).toContain("If you did not request this");
    expect(result.text).toContain("Your password will not change unless you complete the reset.");
  });
  it("does not add unrelated transaction details to verification emails", async () => {
    const result = await renderMessage(messages[0]);
    expect(result.text).not.toContain("Reference:");
    expect(result.text).not.toContain("Receipt:");
    expect(result.text).not.toContain("AUD");
  });
  it("keeps subject lines on one line", async () => {
    const result = await renderMessage({ ...base, type: "BOOKING_CONFIRMATION", detailUrl: url, bookingReference: "B-123", classTitle: "Class\r\nname", classDate: "30 November 2026", amount: "AUD 120.00" });
    expect(result.subject).not.toMatch(/[\r\n]/);
  });
  it.each(messages)("renders $type with safe HTML and plain text", async message => {
    const result = await renderMessage(message);
    expect(result.subject).toBeTruthy();
    expect(result.html).toContain("ANZ Migration Academy");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("Tahoma, Arial, sans-serif");
    expect(result.html).toContain("font-size:14px");
    expect(result.text).toContain("If the button does not work");
    expect(result.text).toContain(url);
    if ("bookingReference" in message) expect(result.text).toContain(message.bookingReference);
    if ("amount" in message) expect(result.text).toContain(message.amount);
    if (message.type === "PAYMENT_RECEIPT") expect(result.text).toContain("not attendance confirmation");
  });
});
