import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { classrooms, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid, generateCode, retryOnUnique } from "@/lib/utils";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });

  const rows = await db
    .select()
    .from(classrooms)
    .where(eq(classrooms.teacherId, profile.id))
    .orderBy(classrooms.createdAt);

  return NextResponse.json(rows.reverse());
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });
  if (profile.role !== "teacher") return NextResponse.json({ error: "Teachers only" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const id = nanoid();
  const now = new Date();

  const [classroom] = await retryOnUnique(async () => {
    return db
      .insert(classrooms)
      .values({
        id,
        teacherId: profile.id,
        name: name.trim(),
        joinCode: generateCode(),
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  });

  return NextResponse.json(classroom, { status: 201 });
}
