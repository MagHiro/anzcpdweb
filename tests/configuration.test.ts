import { expect, it } from "vitest";
import { hasRealCredential } from "@/lib/configuration";

it("does not mistake placeholder keys for configured services", () => {
  for (const value of [undefined, "", "  ", "sk_live_placeholder", "whsec_replace_me", "your_key"]) expect(hasRealCredential(value)).toBe(false);
  expect(hasRealCredential("sk_test_123456789")).toBe(true);
});
