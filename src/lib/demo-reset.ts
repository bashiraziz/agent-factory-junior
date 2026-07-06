import { db } from "@/db";
import {
  profiles,
  parentChildLinks,
  childCredentials,
  projects,
  agentRuns,
  chatMessages,
  classroomMembers,
  usageLimits,
  lessonProgress,
} from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

export const DEMO_EMAIL = "demo@agentfactoryfoundations.com";
const SEEDED_CHILD_ID = "demo_profile_child_001";

export async function resetDemoData(): Promise<{ deleted: number }> {
  // Resolve demo user via the Better Auth user table
  const rows = await db.execute<{ id: string }>(
    sql`SELECT id FROM "user" WHERE email = ${DEMO_EMAIL} LIMIT 1`
  );
  const demoUserId: string | undefined =
    (rows as unknown as { rows: { id: string }[] }).rows?.[0]?.id ??
    (rows as unknown as { id: string }[])[0]?.id;

  if (!demoUserId) return { deleted: 0 };

  const [parentProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, demoUserId));

  if (!parentProfile) return { deleted: 0 };

  return purgeDemoChildren(parentProfile.id);
}

export async function purgeDemoChildren(parentProfileId: string): Promise<{ deleted: number }> {
  const links = await db
    .select({ studentId: parentChildLinks.studentId })
    .from(parentChildLinks)
    .where(eq(parentChildLinks.parentId, parentProfileId));

  const toDelete = links
    .map((l) => l.studentId)
    .filter((id) => id !== SEEDED_CHILD_ID);

  if (toDelete.length === 0) return { deleted: 0 };

  const childProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(inArray(projects.ownerId, toDelete));
  const projectIds = childProjects.map((p) => p.id);

  if (projectIds.length > 0) {
    await db.delete(chatMessages).where(inArray(chatMessages.projectId, projectIds));
  }
  for (const id of toDelete) {
    await db.delete(agentRuns).where(eq(agentRuns.studentId, id));
  }
  try {
    for (const id of toDelete) {
      await db.delete(lessonProgress).where(eq(lessonProgress.studentId, id));
    }
  } catch { /* ignore if table lags schema */ }
  if (projectIds.length > 0) {
    await db.delete(projects).where(inArray(projects.ownerId, toDelete));
  }
  for (const id of toDelete) {
    await db.delete(classroomMembers).where(eq(classroomMembers.studentId, id));
  }

  const childRows = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(inArray(profiles.id, toDelete));
  const childUserIds = childRows.map((r) => r.userId);

  if (childUserIds.length > 0) {
    await db.delete(usageLimits).where(inArray(usageLimits.userId, childUserIds));
  }
  await db.delete(childCredentials).where(inArray(childCredentials.profileId, toDelete));
  await db.delete(parentChildLinks).where(inArray(parentChildLinks.studentId, toDelete));
  await db.delete(profiles).where(inArray(profiles.id, toDelete));

  return { deleted: toDelete.length };
}
