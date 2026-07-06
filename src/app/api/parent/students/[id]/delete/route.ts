import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  profiles,
  projects,
  agentRuns,
  chatMessages,
  parentChildLinks,
  classroomMembers,
  lessonProgress,
  usageLimits,
  childCredentials,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: childId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [parentProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));

  if (!parentProfile || parentProfile.role !== "parent") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Verify this child belongs to this parent
  const [link] = await db
    .select()
    .from(parentChildLinks)
    .where(eq(parentChildLinks.studentId, childId));

  if (!link || link.parentId !== parentProfile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [childProfile] = await db.select().from(profiles).where(eq(profiles.id, childId));
  if (!childProfile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Collect project IDs so we can cascade to chat_messages
  const childProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.ownerId, childId));
  const projectIds = childProjects.map((p) => p.id);

  // Delete in dependency order
  if (projectIds.length > 0) {
    await db.delete(chatMessages).where(inArray(chatMessages.projectId, projectIds));
  }
  await db.delete(agentRuns).where(eq(agentRuns.studentId, childId));
  try { await db.delete(lessonProgress).where(eq(lessonProgress.studentId, childId)); } catch { /* table may lag schema */ }
  await db.delete(projects).where(eq(projects.ownerId, childId));
  await db.delete(classroomMembers).where(eq(classroomMembers.studentId, childId));
  await db.delete(usageLimits).where(eq(usageLimits.userId, childProfile.userId));
  await db.delete(childCredentials).where(eq(childCredentials.profileId, childId));
  await db.delete(parentChildLinks).where(eq(parentChildLinks.studentId, childId));
  await db.delete(profiles).where(eq(profiles.id, childId));

  return NextResponse.json({ deleted: true });
}
