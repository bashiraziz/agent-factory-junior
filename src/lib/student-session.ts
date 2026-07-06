import { cookies } from "next/headers";
import { db } from "@/db";
import { childCredentials, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const CHILD_COOKIE = "afj-child-session";

export async function getChildProfile() {
  const token = (await cookies()).get(CHILD_COOKIE)?.value;
  if (!token) return null;

  const [cred] = await db
    .select()
    .from(childCredentials)
    .where(eq(childCredentials.sessionToken, token));

  if (!cred) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, cred.profileId));

  return profile ?? null;
}
