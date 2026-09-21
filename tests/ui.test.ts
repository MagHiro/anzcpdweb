import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Field, TextInput, formatStatusLabel } from "@/components/ui";
import { MoneyInput } from "@/components/money-input";
import { BookingStatus } from "@/components/booking-status";

describe("redesigned shared controls", () => {
  it("keeps base input styles when a caller adds a class", () => {
    const html = renderToStaticMarkup(createElement(TextInput, { className: "extra-style" }));
    expect(html).toContain("focus-ring");
    expect(html).toContain("extra-style");
  });

  it("creates distinct IDs for repeated field names", () => {
    const field = () => createElement(Field, { label: "Name" } as Parameters<typeof Field>[0], createElement(TextInput, { name: "name" }));
    const html = renderToStaticMarkup(createElement("div", null, field(), field()));
    const ids = [...html.matchAll(/<input[^>]* id="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(html).toContain(`for="${id}"`);
  });

  it("displays currency amounts while submitting integer minor units", () => {
    const html = renderToStaticMarkup(createElement(MoneyInput, { name: "priceMinorUnits", defaultMinor: 19525 }));
    expect(html).toContain('value="195.25"');
    expect(html).toContain('name="priceMinorUnits" value="19525"');
    expect(html).toContain('step="0.01"');
  });

  it("uses human status labels and does not imply processing is confirmed", () => {
    expect(formatStatusLabel("PENDING_PAYMENT")).toBe("Awaiting payment");
    const html = renderToStaticMarkup(createElement(BookingStatus, { status: "PAYMENT_PROCESSING" }));
    expect(html).toContain("Please do not pay again");
    expect(html).not.toContain("Your place is confirmed");
  });
});
