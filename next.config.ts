import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";

const appVersion = process.env.NEXT_DEPLOYMENT_ID || randomUUID();

const nextConfig: NextConfig = {
  deploymentId: appVersion,
  env: { NEXT_PUBLIC_APP_VERSION: appVersion },
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
