import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendEmail } from "@/lib/email/resend";

const databaseUrl = process.env.DATABASE_URL;
const ssl =
  databaseUrl && databaseUrl.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined;

const resolvedSecret =
  process.env.BETTER_AUTH_SECRET || "dev-insecure-secret-please-set-env-32ch";
const authUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const database = databaseUrl
  ? new Pool({ connectionString: databaseUrl, ssl })
  : undefined;

export const auth = betterAuth({
  baseURL: authUrl,
  secret: resolvedSecret,
  database,
  emailAndPassword: { enabled: true },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email — Agent Factory Junior",
        html: `
          <div style="font-family: Nunito, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="font-family: Fredoka, sans-serif; color: #2A2A3C; font-size: 24px;">
              Welcome to Agent Factory Junior 👋
            </h1>
            <p style="color: #5C5747; font-size: 16px;">
              Click the button below to verify your email and start setting up your child's account.
            </p>
            <a href="${url}" style="display: inline-block; padding: 14px 32px; background: #7C5CFF;
              color: white; border-radius: 999px; font-weight: 700; font-size: 16px;
              text-decoration: none; box-shadow: 0 4px 0 #5B43E0;">
              Verify my email →
            </a>
            <p style="color: #8A8071; font-size: 13px; margin-top: 24px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    },
    autoSignInAfterVerification: true,
  },
});

export type Session = typeof auth.$Infer.Session;
