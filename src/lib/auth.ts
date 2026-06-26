import { betterAuth } from "better-auth";
import { Pool } from "pg";

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
});

export type Session = typeof auth.$Infer.Session;
