import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, profiles, classroomMembers, classrooms } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const action: unknown = body?.action;
  if (action !== "approve" && action !== "reject" && action !== "remove") {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [membership] = await db.select().from(classroomMembers)
    .leftJoin(classrooms, eq(classroomMembers.classroomId, classrooms.id))
    .where(and(
      eq(classroomMembers.studentId, project.ownerId),
      eq(classrooms.teacherId, profile.id),
    ));
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let newStatus: string | null;
  let newSharedAt: Date | null = null;
  if (action === "approve") {
    newStatus = "approved";
    newSharedAt = new Date();
  } else if (action === "reject") {
    newStatus = "rejected";
  } else {
    newStatus = null;
  }

  await db.update(projects).set({ shareStatus: newStatus, sharedAt: newSharedAt })
    .where(eq(projects.id, id));

  return NextResponse.json({ shareStatus: newStatus });
}
