export const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "development";
export const deploymentHeader = "x-app-version";
export const deploymentField = "__appVersion";

export function requiresCurrentDeployment(method: string, pathname: string) {
  // Stripe is a server-to-server integration, not an application browser action.
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase()) && pathname !== "/api/stripe/webhook";
}
