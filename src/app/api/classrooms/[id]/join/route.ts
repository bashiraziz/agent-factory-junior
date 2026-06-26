import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { classrooms, classroomMembers, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });
  if (profile.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });

  const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
  if (!classroom) return NextResponse.json({ error: "Classroom not found" }, { status: 404 });

  // Check not already a member
  const [existing] = await db
    .select()
    .from(classroomMembers)
    .where(and(eq(classroomMembers.classroomId, id), eq(classroomMembers.studentId, profile.id)));

  if (existing) return NextResponse.json({ ok: true, alreadyMember: true });

  await db.insert(classroomMembers).values({
    id: nanoid(),
    classroomId: id,
    studentId: profile.id,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
