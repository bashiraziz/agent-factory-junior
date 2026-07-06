import { redirect, notFound } from "next/navigation";
import { db } from "@/db";
import { lessonProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";
import { getChapter, CORE_CHAPTERS } from "@/lib/lessons/book-chapters";
import { LessonClient } from "./lesson-client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await params;
  const chapter = getChapter(chapterId);
  if (!chapter) notFound();

  const profile = await resolveStudentProfile();
  if (!profile) redirect("/join");
  if (profile.role !== "student") redirect(`/${profile.role}/dashboard`);

  const rows = await db
    .select({ chapterId: lessonProgress.chapterId })
    .from(lessonProgress)
    .where(eq(lessonProgress.studentId, profile.id));

  const completedIds = rows.map((r) => r.chapterId);
  const completedSet = new Set(completedIds);

  // Enforce core lock: chapter N locked unless chapter N-1 is done
  if (chapter.track === "core") {
    const idx = CORE_CHAPTERS.findIndex((c) => c.id === chapterId);
    if (idx > 0 && !completedSet.has(CORE_CHAPTERS[idx - 1].id)) {
      redirect("/student/learn");
    }
  }

  const alreadyDone = completedSet.has(chapterId);

  return (
    <LessonClient
      chapter={chapter}
      completedIds={completedIds}
      alreadyDone={alreadyDone}
    />
  );
}
