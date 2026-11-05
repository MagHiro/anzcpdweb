import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth/auth";
import { isPublicAuthEndpoint } from "@/lib/security/auth-endpoints";
import { isSameOrigin } from "@/lib/security/origin";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

async function handle(request: Request) {
  if (!isPublicAuthEndpoint(request.method, new URL(request.url).pathname)) return Response.json({ error: "Not found." }, { status: 404 });
  if (request.method !== "GET" && !isSameOrigin(request)) return Response.json({ error: "Request origin not allowed." }, { status: 403 });
  return request.method === "GET" ? handlers.GET(request) : handlers.POST(request);
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
