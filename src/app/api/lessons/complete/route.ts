import { type NextRequest, NextResponse } from "next/server";
import { resolveStudentProfile } from "@/lib/student-auth";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getChapter, CORE_CHAPTERS } from "@/lib/lessons/book-chapters";

export async function POST(req: NextRequest) {
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { chapterId?: string };
  const chapter = body.chapterId ? getChapter(body.chapterId) : undefined;
  if (!chapter) return NextResponse.json({ error: "Invalid chapterId" }, { status: 400 });

  // Upsert — ON CONFLICT DO NOTHING keeps original completedAt
  await db.insert(lessonProgress).values({
    id: crypto.randomUUID(),
    studentId: profile.id,
    chapterId: chapter.id,
  }).onConflictDoNothing();

  const completed = await db
    .select({ chapterId: lessonProgress.chapterId })
    .from(lessonProgress)
    .where(eq(lessonProgress.studentId, profile.id));

  const completedIds = completed.map((r) => r.chapterId);
  const completedCoreCount = CORE_CHAPTERS.filter((c) => completedIds.includes(c.id)).length;

  return NextResponse.json({
    ok: true,
    completedChapterIds: completedIds,
    completedCoreCount,
    isPathComplete: completedCoreCount === 8,
  });
}
