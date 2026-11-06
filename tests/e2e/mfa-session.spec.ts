import { createHmac, randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { account, user, session as sessions } from "@/db/schema";
import { getDb } from "@/lib/db";

function totp(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map(char => alphabet.indexOf(char).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac("sha1", key).update(counter).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}

test("customer MFA setup, required challenge, single-use recovery and session durations", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Isolated database required");
  const db = getDb();
  const id = randomUUID();
  const email = `mfa-${id}@example.com`;
  const password = `Test-${randomUUID()}`;
  await db.insert(user).values({ id, name: "MFA Customer", email, emailVerified: true });
  await db.insert(account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(password) });
  async function login(remember = false) {
    await page.goto("/sign-in");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    if (remember) await page.getByRole("checkbox", { name: "Remember me for 7 days" }).check();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  async function post(path: string, body: object) {
    return page.evaluate(async ({ path, body }) => {
      const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      return { status: response.status, data: await response.json() };
    }, { path, body });
  }
  try {
    await login();
    await page.waitForURL("/account");
    const [short] = await db.select().from(sessions).where(eq(sessions.userId, id));
    expect(short.expiresAt.getTime() - short.createdAt.getTime()).toBeGreaterThan(3590000);
    expect(short.expiresAt.getTime() - short.createdAt.getTime()).toBeLessThanOrEqual(3601000);
    await page.goto("/account/security");
    await expect(page.getByRole("heading", { name: "Multi-factor authentication" })).toBeVisible();
    expect((await post("/api/account/mfa/enable", { password: "incorrect" })).status).toBe(400);
    const setup = await post("/api/account/mfa/enable", { password });
    expect(setup.status).toBe(200);
    expect((await db.select().from(user).where(eq(user.id, id)))[0].twoFactorEnabled).toBe(false);
    const secret = new URL(setup.data.totpURI).searchParams.get("secret")!;
    expect((await post("/api/account/mfa/verify", { code: totp(secret) })).status).toBe(200);
    expect((await db.select().from(user).where(eq(user.id, id)))[0].twoFactorEnabled).toBe(true);
    const [afterSetup] = await db.select().from(sessions).where(eq(sessions.userId, id));
    expect(afterSetup.expiresAt.getTime()).toBeLessThanOrEqual(short.expiresAt.getTime());
    await post("/api/auth/sign-out", {});
    await login(true);
    await expect(page.getByRole("button", { name: "Verify and sign in" })).toBeVisible();
    expect(await db.select().from(sessions).where(eq(sessions.userId, id))).toHaveLength(0);
    await page.getByRole("button", { name: "Use a recovery code" }).click();
    await page.locator('input[name="code"]').fill(setup.data.backupCodes[0]);
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.waitForURL("/account");
    const [remembered] = await db.select().from(sessions).where(eq(sessions.userId, id));
    expect(remembered.expiresAt.getTime() - remembered.createdAt.getTime()).toBeGreaterThan(6.99 * 86400000);
    await post("/api/auth/sign-out", {});
    await login();
    await expect(page.getByRole("button", { name: "Verify and sign in" })).toBeVisible();
    expect([400, 401]).toContain((await post("/api/account/mfa/backup", { code: setup.data.backupCodes[0] })).status);
    expect((await post("/api/account/mfa/backup", { code: setup.data.backupCodes[1] })).status).toBe(200);
    const [shortMfa] = await db.select().from(sessions).where(eq(sessions.userId, id));
    expect(shortMfa.expiresAt.getTime() - shortMfa.createdAt.getTime()).toBeLessThanOrEqual(3601000);
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.userId, id));
    await page.goto("/account/security");
    await expect(page).toHaveURL(/sign-in/);
    await login();
    await expect(page.getByRole("button", { name: "Verify and sign in" })).toBeVisible();
    await page.locator('input[name="code"]').fill(totp(secret));
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.waitForURL("/account");
    await page.goto("/account/security");
    const mfa = page.getByRole("region", { name: "Multi-factor authentication" });
    await mfa.locator('input[name="password"]').fill(password);
    await mfa.getByRole("button", { name: "Disable MFA", exact: true }).click();
    await expect(mfa.getByRole("button", { name: "Set up MFA", exact: true })).toBeVisible();
    expect((await db.select().from(user).where(eq(user.id, id)))[0].twoFactorEnabled).toBe(false);
  } finally { await db.delete(user).where(eq(user.id, id)); }
});
