import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { account, emailOutbox, session, user } from "@/db/schema";
import { getDb } from "@/lib/db";

test("unverified users can resend after a correct password, then verify and sign in", async ({ page }) => {
  test.skip(!process.env.DATABASE_URL, "Isolated database required");
  const db = getDb();
  const id = randomUUID();
  const email = `verify-${id}@example.com`;
  const password = `Test-${randomUUID()}`;
  const outbox = () => db.select().from(emailOutbox).where(eq(emailOutbox.recipientEmail, email));
  const sessions = () => db.select().from(session).where(eq(session.userId, id));
  await db.insert(user).values({ id, name: "Unverified Customer", email, emailVerified: false });
  try {
    await db.insert(account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hashPassword(password) });
    const signIn = async (value: string) => {
      await page.getByLabel("Email address").fill(email);
      await page.locator('input[name="password"]').fill(value);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
    };
    const resend = page.getByRole("button", { name: "Resend verification email" });
    const resendPath = "/api/auth/resend-verification";
    const requestResend = (body: object) => page.evaluate(async ({ path, body }) => (await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).status, { path: resendPath, body });
    await page.goto("/sign-in");
    await signIn("incorrect-password");
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(resend).toHaveCount(0);
    expect(await requestResend({ email })).toBe(400);
    await signIn(password);
    await expect(resend).toBeVisible();
    expect(await outbox()).toHaveLength(0);
    expect(await sessions()).toHaveLength(0);

    const sent = page.waitForResponse(response => response.url().endsWith(resendPath));
    await resend.click();
    const response = await sent;
    expect(response.status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: "Check your inbox" })).toBeVisible();
    expect(await requestResend(response.request().postDataJSON())).toBe(429);

    const messages = await outbox();
    expect(messages).toHaveLength(1);
    expect(messages[0].messageType).toBe("EMAIL_VERIFICATION");
    const link = new URL((messages[0].payload as { url: string }).url);
    await page.goto(link.toString());
    await expect(page).toHaveURL(/\/sign-in$/);
    expect((await db.select().from(user).where(eq(user.id, id)))[0].emailVerified).toBe(true);
    expect(await sessions()).toHaveLength(0);
    await signIn(password);
    await expect(page).toHaveURL(/\/account$/);
  } finally {
    await db.delete(emailOutbox).where(eq(emailOutbox.recipientEmail, email));
    await db.delete(user).where(eq(user.id, id));
  }
});
