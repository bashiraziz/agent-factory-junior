import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { parentChildLinks, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });
  if (profile.role !== "parent") return NextResponse.json({ error: "Parents only" }, { status: 403 });

  const { linkCode } = await req.json();
  if (!linkCode?.trim()) return NextResponse.json({ error: "Link code required" }, { status: 400 });

  // Find the student with that link code
  const [student] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.linkCode, linkCode.trim().toUpperCase()));

  if (!student || student.role !== "student") {
    return NextResponse.json({ error: "No student found with that code" }, { status: 404 });
  }

  // Prevent duplicate links
  const [existing] = await db
    .select()
    .from(parentChildLinks)
    .where(and(eq(parentChildLinks.parentId, profile.id), eq(parentChildLinks.studentId, student.id)));

  if (existing) return NextResponse.json({ ok: true, alreadyLinked: true, student });

  await db.insert(parentChildLinks).values({
    id: nanoid(),
    parentId: profile.id,
    studentId: student.id,
    linkCode: linkCode.trim().toUpperCase(),
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, student });
}
