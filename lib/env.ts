import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_DEV_BYPASS: z.enum(["true", "false"]).default("false"),
  EMAIL_PROVIDER: z.enum(["auto", "resend", "smtp"]).default("auto"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("ANZ CPD <noreply@example.com>"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_REQUIRE_TLS: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_PROCESSING_SECRET: z.string().optional(),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12).optional(),
  INITIAL_ADMIN_NAME: z.string().min(2).optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type EmailProvider = "none" | "resend" | "smtp";

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;

  const isBuild = process.env.NEXT_PHASE === "phase-production-build";

  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ?? (isBuild ? "postgresql://localhost/anzcpd" : undefined),
    APP_URL: process.env.APP_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? (isBuild ? "build-only-secret-that-is-never-used-1234567890" : undefined),
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    TURNSTILE_DEV_BYPASS: process.env.TURNSTILE_DEV_BYPASS,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_REQUIRE_TLS: process.env.SMTP_REQUIRE_TLS,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    EMAIL_PROCESSING_SECRET: process.env.EMAIL_PROCESSING_SECRET,
    INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL,
    INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD,
    INITIAL_ADMIN_NAME: process.env.INITIAL_ADMIN_NAME,
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.message}`);
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function requireConfigured(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function resolveEmailProvider(env: ServerEnv): EmailProvider {
  if (env.EMAIL_PROVIDER === "smtp") return "smtp";
  if (env.EMAIL_PROVIDER === "resend") return "resend";
  if (env.SMTP_HOST) return "smtp";
  if (env.RESEND_API_KEY) return "resend";
  return "none";
}

export function isEmailProviderConfigured(env: ServerEnv): boolean {
  const provider = resolveEmailProvider(env);
  if (provider === "resend") return Boolean(env.RESEND_API_KEY);
  if (provider === "smtp") {
    const hasUser = Boolean(env.SMTP_USER);
    const hasPassword = Boolean(env.SMTP_PASSWORD);
    return Boolean(env.SMTP_HOST) && hasUser === hasPassword;
  }
  return false;
}

export function isDevelopmentTurnstileBypassEnabled(): boolean {
  const env = getServerEnv();
  return env.NODE_ENV !== "production" && env.TURNSTILE_DEV_BYPASS === "true";
}
