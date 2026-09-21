import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth/auth";
import { getDb } from "@/lib/db";
import { user } from "@/db/schema";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireCustomerSession() {
  const session = await getServerSession();
  if (!session) throw new Error("You must be signed in to continue.");
  return session;
}

export async function requireAdminSession() {
  const session = await getServerSession();
  if (!session) throw new Error("You must be signed in to continue.");
  const [accountUser] = await getDb().select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (accountUser?.role !== "ADMIN") throw new Error("You do not have permission to perform this action.");
  return session;
}

export async function getAdminSessionOrNull() {
  const session = await getServerSession();
  if (!session) return null;
  const [accountUser] = await getDb().select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1);
  return accountUser?.role === "ADMIN" ? session : null;
}
