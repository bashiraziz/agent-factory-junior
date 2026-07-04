import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classrooms, classroomMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveStudentProfile } from "@/lib/student-auth";

export async function POST(req: NextRequest) {
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });

  const body = await req.json();
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : null;
  if (!code) return NextResponse.json({ error: "Class code is required." }, { status: 400 });

  const [classroom] = await db.select().from(classrooms).where(eq(classrooms.joinCode, code));
  if (!classroom) return NextResponse.json({ error: "That code doesn't match any class. Check with your teacher." }, { status: 404 });

  const [existing] = await db.select().from(classroomMembers)
    .where(and(eq(classroomMembers.classroomId, classroom.id), eq(classroomMembers.studentId, profile.id)));
  if (existing) return NextResponse.json({ ok: true, alreadyMember: true });

  await db.insert(classroomMembers).values({
    id: nanoid(),
    classroomId: classroom.id,
    studentId: profile.id,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
