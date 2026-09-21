import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { account, session, user, verification } from "@/db/schema";
import { getDb } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { queueEmail } from "@/server/email/service";
import { linkVerifiedEmailBookings } from "@/server/auth/tokens";

const env = getServerEnv();

export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification },
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
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
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
  plugins: [nextCookies()],
});
