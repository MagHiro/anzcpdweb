import { NextResponse, type NextRequest } from "next/server";
import { appVersion, deploymentField, deploymentHeader, requiresCurrentDeployment } from "@/lib/deployment";

export async function proxy(request: NextRequest) {
  if (requiresCurrentDeployment(request.method, request.nextUrl.pathname)) {
    let version = request.headers.get(deploymentHeader);
    if (!version && /^(multipart\/form-data|application\/x-www-form-urlencoded)/i.test(request.headers.get("content-type") ?? "")) {
      try { version = (await request.clone().formData()).get(deploymentField)?.toString() ?? null; } catch { /* Missing or malformed version is rejected below. */ }
    }
    if (version !== appVersion) {
      return NextResponse.json({ code: "DEPLOYMENT_UPDATED", error: "The application has been updated. Reload the page before continuing." }, {
        status: 409,
        headers: { "Cache-Control": "no-store", [deploymentHeader]: appVersion },
      });
    }
  }
  const nonce = btoa(crypto.randomUUID());
  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isProduction ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://api.stripe.com",
    "frame-src https://challenges.cloudflare.com https://checkout.stripe.com",
    "form-action 'self' https://checkout.stripe.com",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  if (/^\/(api|admin|account|booking)(\/|$)/.test(request.nextUrl.pathname) || ["/sign-in", "/reset-password", "/verify-email"].includes(request.nextUrl.pathname)) response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-Frame-Options", "DENY");
  if (isProduction) response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
