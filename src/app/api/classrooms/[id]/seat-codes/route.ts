import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { classroomSeatCodes, classrooms, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid, generateCode } from "@/lib/utils";

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

  const codes = await db
    .select()
    .from(classroomSeatCodes)
    .where(eq(classroomSeatCodes.classroomId, id));

  // Attach nickname from profile if joined
  const enriched = await Promise.all(
    codes.map(async (seat) => {
      if (!seat.profileId) return { ...seat, nickname: null };
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, seat.profileId));
      return { ...seat, nickname: profile?.displayName ?? null };
    })
  );

  return NextResponse.json(enriched);
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
  const rows = Array.from({ length: n }, () => ({
    id: nanoid(),
    classroomId: id,
    code: generateCode(),
    createdAt: now,
  }));

  await db.insert(classroomSeatCodes).values(rows);

  return NextResponse.json({ ok: true, count: n, codes: rows.map((r) => r.code) }, { status: 201 });
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
    .set({ isActive: false })
    .where(and(eq(classroomSeatCodes.id, codeId), eq(classroomSeatCodes.classroomId, id)));

  return NextResponse.json({ ok: true });
}
