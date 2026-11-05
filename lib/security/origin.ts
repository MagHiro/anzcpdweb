import { getServerEnv } from "@/lib/env";

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(getServerEnv().APP_URL).origin;
  } catch {
    return false;
  }
}
