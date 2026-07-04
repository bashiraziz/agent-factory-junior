import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, classrooms, classroomMembers, projects } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: classroomId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [classroom] = await db.select().from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, profile.id)));
  if (!classroom) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const members = await db.select({ studentId: classroomMembers.studentId })
    .from(classroomMembers).where(eq(classroomMembers.classroomId, classroomId));
  const studentIds = members.map((m) => m.studentId);

  if (!studentIds.length) return NextResponse.json({ pending: [], approved: [] });

  const rows = await db
    .select({ project: projects, ownerName: profiles.displayName })
    .from(projects)
    .leftJoin(profiles, eq(projects.ownerId, profiles.id))
    .where(
      and(
        inArray(projects.ownerId, studentIds),
        inArray(projects.shareStatus, ["pending", "approved"]),
      )
    );

  const pending = rows
    .filter((r) => r.project.shareStatus === "pending")
    .map((r) => ({ ...r.project, ownerName: r.ownerName }));
  const approved = rows
    .filter((r) => r.project.shareStatus === "approved")
    .map((r) => ({ ...r.project, ownerName: r.ownerName }));

  return NextResponse.json({ pending, approved });
}
