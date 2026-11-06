import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { getDb } from "@/lib/db";
import { auth } from "@/server/auth/auth";

export async function requestAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const [row] = await getDb().select({ id: user.id, role: user.role }).from(user).where(eq(user.id, session.user.id));
  return row?.role === "ADMIN" ? row : null;
}
