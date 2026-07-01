import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, parentChildLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function resolveParent() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "parent") return null;
  return profile;
}

export async function verifyParentChildLink(parentProfileId: string, studentId: string) {
  const [link] = await db
    .select()
    .from(parentChildLinks)
    .where(
      and(eq(parentChildLinks.parentId, parentProfileId), eq(parentChildLinks.studentId, studentId))
    );
  return link ?? null;
}
