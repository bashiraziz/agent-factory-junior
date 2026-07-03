import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { classroomSeatCodes, classrooms, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid, generateCode, retryOnUnique } from "@/lib/utils";

async function requireTeacher(classroomId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  if (profile?.role !== "teacher") return null;

  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, profile.id)));
  if (!classroom) return null;

  return { profile, classroom };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireTeacher(id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      id: classroomSeatCodes.id,
      classroomId: classroomSeatCodes.classroomId,
      code: classroomSeatCodes.code,
      profileId: classroomSeatCodes.profileId,
      sessionToken: classroomSeatCodes.sessionToken,
      isActive: classroomSeatCodes.isActive,
      joinedAt: classroomSeatCodes.joinedAt,
      expiresAt: classroomSeatCodes.expiresAt,
      createdAt: classroomSeatCodes.createdAt,
      nickname: profiles.displayName,
    })
    .from(classroomSeatCodes)
    .leftJoin(profiles, eq(classroomSeatCodes.profileId, profiles.id))
    .where(eq(classroomSeatCodes.classroomId, id));

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireTeacher(id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count = 10 } = await req.json();
  const n = Math.min(Math.max(1, Number(count)), 50);

  const now = new Date();
  const created: string[] = [];
  for (let i = 0; i < n; i++) {
    await retryOnUnique(async () => {
      const code = generateCode();
      await db.insert(classroomSeatCodes).values({
        id: nanoid(),
        classroomId: id,
        code,
        createdAt: now,
      });
      created.push(code);
    });
  }

  return NextResponse.json({ ok: true, count: created.length, codes: created }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireTeacher(id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { codeId, action } = await req.json();
  if (!codeId || action !== "reset") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await db
    .update(classroomSeatCodes)
    .set({ profileId: null, sessionToken: null, joinedAt: null, isActive: true })
    .where(and(eq(classroomSeatCodes.id, codeId), eq(classroomSeatCodes.classroomId, id)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireTeacher(id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { codeId } = await req.json();
  await db
    .update(classroomSeatCodes)
    .set({ isActive: false, sessionToken: null })
    .where(and(eq(classroomSeatCodes.id, codeId), eq(classroomSeatCodes.classroomId, id)));

  return NextResponse.json({ ok: true });
}
