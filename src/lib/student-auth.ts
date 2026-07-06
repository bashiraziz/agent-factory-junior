import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSeatProfile } from "./seat-session";
import { getChildProfile } from "./student-session";

/**
 * Resolves the current student's profile from PIN cookie, seat cookie, or
 * Better Auth session — in that order. PIN/seat take priority so a coexisting
 * parent Better Auth session doesn't override the student identity.
 */
export async function resolveStudentProfile() {
  const child = await getChildProfile();
  if (child) return child;

  const seat = await getSeatProfile();
  if (seat) return seat;

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));
    if (profile) return profile;
  }

  return null;
}
