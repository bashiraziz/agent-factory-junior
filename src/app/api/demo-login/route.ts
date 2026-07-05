import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
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
import { eq, ne, inArray, sql } from "drizzle-orm";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

// Fixed ID for the seeded demo child — never deleted during reset
const SEEDED_CHILD_ID = "demo_profile_child_001";

async function resetDemoChildren(parentProfileId: string) {
  // Find all children linked to this demo parent except the seeded one
  const links = await db
    .select({ studentId: parentChildLinks.studentId })
    .from(parentChildLinks)
    .where(eq(parentChildLinks.parentId, parentProfileId));

  const toDelete = links
    .map((l) => l.studentId)
    .filter((id) => id !== SEEDED_CHILD_ID);

  if (toDelete.length === 0) return;

  // Cascade delete in dependency order
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
  } catch { /* table may not exist on older installs */ }
  if (projectIds.length > 0) {
    await db.delete(projects).where(inArray(projects.ownerId, toDelete));
  }
  for (const id of toDelete) {
    await db.delete(classroomMembers).where(eq(classroomMembers.studentId, id));
  }

  const childProfileRows = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(inArray(profiles.id, toDelete));
  const childUserIds = childProfileRows.map((r) => r.userId);

  if (childUserIds.length > 0) {
    await db.delete(usageLimits).where(inArray(usageLimits.userId, childUserIds));
  }
  await db.delete(childCredentials).where(inArray(childCredentials.profileId, toDelete));
  await db.delete(parentChildLinks).where(inArray(parentChildLinks.studentId, toDelete));
  await db.delete(profiles).where(inArray(profiles.id, toDelete));
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    const result = await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true },
      headers: new Headers(),
    }) as { token?: string; user?: { id: string } } | null;

    if (!result?.token) {
      console.error("Demo login: no token returned", result);
      return NextResponse.redirect(new URL("/sign-in", origin));
    }

    if (result.user?.id) {
      // Reset role to parent
      const [parentProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, result.user.id));

      if (parentProfile) {
        await db
          .update(profiles)
          .set({ role: "parent", updatedAt: new Date() })
          .where(eq(profiles.userId, result.user.id));

        // Wipe any children added by previous demo users, keep the seeded child
        await resetDemoChildren(parentProfile.id);
      }

      // Mark email as verified — demo@agentfactoryjr.com has no real inbox
      await db.execute(
        sql`UPDATE "user" SET "emailVerified" = true WHERE id = ${result.user.id}`
      );
    }

    const jar = await cookies();
    for (const name of ["afj-child-session", "afj-seat-session", "afj-role"]) {
      jar.delete(name);
    }

    jar.set("better-auth.session_token", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(new URL("/parent/dashboard", origin));
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
}
