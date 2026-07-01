import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSeatProfile } from "./seat-session";

/**
 * Resolves the current student's profile from either a Better Auth session
 * or a seat-code session cookie. Returns null if neither is present.
 */
export async function resolveStudentProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    if (profile) return profile;
  }

  return getSeatProfile();
}
