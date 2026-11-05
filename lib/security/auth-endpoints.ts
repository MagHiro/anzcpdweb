/** Browser auth mutations must use our validated, rate-limited routes. */
export function isPublicAuthEndpoint(method: string, pathname: string) {
  const path = pathname.replace(/\/+$/, "");
  if (method === "GET") return ["/api/auth/get-session", "/api/auth/verify-email", "/api/auth/error"].includes(path) || /^\/api\/auth\/reset-password\/[A-Za-z0-9_-]+$/.test(path);
  return method === "POST" && path === "/api/auth/sign-out";
}
