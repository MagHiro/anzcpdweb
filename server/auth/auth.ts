import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { account, session, user, verification, twoFactor as twoFactorTable } from "@/db/schema";
import { twoFactor } from "better-auth/plugins";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { queueEmail } from "@/server/email/service";
import { linkVerifiedEmailBookings } from "@/server/auth/tokens";

const env = getServerEnv();

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification, twoFactor: twoFactorTable },
    transaction: true,
  }),
  baseURL: env.APP_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_URL],
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    disableSessionRefresh: true,
  },
  databaseHooks: {
    session: { create: { before: async (session, context) => {
      // Better Auth uses a one-day expiry for rememberMe:false, including
      // sessions created after a successful second-factor challenge.
      const shortSession = session.expiresAt.getTime() - Date.now() <= 86400000 + 5000;
      const previousExpiry = context?.context.session?.session.expiresAt;
      const expiresAt = previousExpiry ? new Date(Math.min(new Date(previousExpiry).getTime(), session.expiresAt.getTime())) : new Date(Date.now() + (shortSession ? 3600 : 7 * 86400) * 1000);
      return { data: { ...session, expiresAt } };
    } } },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "CUSTOMER",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 30 * 60,
    requireEmailVerification: true,
    sendResetPassword: async ({ user: resetUser, url }) => {
      await queueEmail({ type: "PASSWORD_RESET", email: resetUser.email, name: resetUser.name, url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user: verificationUser, url }) => {
      await queueEmail({ type: "EMAIL_VERIFICATION", email: verificationUser.email, name: verificationUser.name, url });
    },
    afterEmailVerification: async (verifiedUser) => {
      await linkVerifiedEmailBookings(verifiedUser.email, verifiedUser.id);
    },
  },
  plugins: [twoFactor({ issuer: "ANZ Migration Academy", twoFactorCookieMaxAge: 600 }), nextCookies()],
});
