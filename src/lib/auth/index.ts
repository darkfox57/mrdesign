import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { ac, roles } from "./permissions";
import { RESET_TOKEN_SECONDS } from "./reset-config";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Accounts are created by an admin (or the first-admin script), never by self sign-up.
    disableSignUp: true,
    minPasswordLength: 12,
    // Forgotten passwords: the dashboard asks for the email at /admin/recuperar and the link
    // leads to /admin/restablecer. A blocked account gets no email.
    // Not awaited: better-auth awaits this hook, and waiting for Brevo would make existing
    // accounts answer slower than unknown ones. Loaded on use: create-admin runs outside Next.
    sendResetPassword: async ({ user, token }) => {
      if ((user as { banned?: boolean | null }).banned) return;
      void import("./reset-email")
        .then(({ queuePasswordResetEmail }) => queuePasswordResetEmail(user, token))
        .catch((error: unknown) => console.error("password reset email failed", error));
    },
    resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS,
    // A new password ends every open session of that account.
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    // No session cookie cache: it would let a banned or demoted user keep access until it expired.
    // The dashboard check (src/lib/auth/session.ts) also asks for a database read explicitly.
    cookieCache: { enabled: false },
  },
  rateLimit: { enabled: true, window: 60, max: 10 },
  plugins: [
    adminPlugin({ ac, roles, defaultRole: "editor", adminRoles: ["admin"] }),
    // Must be last: lets server actions set the session cookie.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
