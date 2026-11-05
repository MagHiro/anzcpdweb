import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { appVersion, deploymentField, deploymentHeader, requiresCurrentDeployment } from "@/lib/deployment";

describe("deployment protection", () => {
  it("requires a current version for browser mutations but not reads or Stripe webhooks", () => {
    expect(requiresCurrentDeployment("POST", "/api/auth/login")).toBe(true);
    expect(requiresCurrentDeployment("POST", "/admin/classes/new")).toBe(true);
    expect(requiresCurrentDeployment("GET", "/account")).toBe(false);
    expect(requiresCurrentDeployment("POST", "/api/stripe/webhook")).toBe(false);
    expect(requiresCurrentDeployment("POST", "/api/stripe/webhook/other")).toBe(true);
  });

  it("rejects missing and stale versions before executing a route or Server Action", async () => {
    for (const version of [null, "old-release"]) {
      const response = await proxy(new NextRequest("https://example.com/admin/classes/new", { method: "POST", headers: version ? { [deploymentHeader]: version, "next-action": "test" } : {} }));
      expect(response.status).toBe(409);
      expect(response.headers.get(deploymentHeader)).toBe(appVersion);
      expect(await response.json()).toMatchObject({ code: "DEPLOYMENT_UPDATED" });
    }
  });

  it("allows versioned API requests and native form posts without consuming their bodies", async () => {
    const api = new NextRequest("https://example.com/api/account/profile", { method: "PATCH", headers: { [deploymentHeader]: appVersion }, body: "test" });
    expect((await proxy(api)).headers.get("x-middleware-next")).toBe("1");
    expect(await api.text()).toBe("test");
    const body = new FormData();
    body.set(deploymentField, appVersion);
    body.set("title", "New title");
    const form = new NextRequest("https://example.com/admin/classes/new", { method: "POST", body });
    expect((await proxy(form)).headers.get("x-middleware-next")).toBe("1");
    expect((await form.formData()).get("title")).toBe("New title");
  });

  it("does not block Stripe delivery or fresh document navigation", async () => {
    for (const [method, path] of [["POST", "/api/stripe/webhook"], ["GET", "/account"]]) {
      expect((await proxy(new NextRequest(`https://example.com${path}`, { method }))).headers.get("x-middleware-next")).toBe("1");
    }
  });
});
