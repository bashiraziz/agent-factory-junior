import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  profiles,
  classrooms,
  agentRuns,
  projects,
  usageLimits,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { LogoutButton } from "@/components/logout-button";
import { CORE_CHAPTERS, BONUS_CHAPTERS } from "@/lib/lessons/book-chapters";
import { StudentRunsTable } from "./student-runs-table";
import { StudentWorkers } from "./student-workers";
import { StudentKpis, RunLimitBar } from "./student-stats";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id: classroomId, studentId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect(`/${profile.role}/dashboard`);

  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.id, classroomId), eq(classrooms.teacherId, profile.id)));
  if (!classroom) notFound();

  const [student] = await db.select().from(profiles).where(eq(profiles.id, studentId));
  if (!student) notFound();

  const studentProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, studentId))
    .orderBy(desc(projects.updatedAt));

  const studentRuns = await db
    .select({ run: agentRuns, projectName: projects.name })
    .from(agentRuns)
    .leftJoin(projects, eq(agentRuns.projectId, projects.id))
    .where(eq(agentRuns.studentId, studentId))
    .orderBy(desc(agentRuns.createdAt))
    .limit(20);

  const [usage] = await db.select().from(usageLimits).where(eq(usageLimits.userId, studentId));

  let completedChapterIds: string[] = [];
  try {
    const { lessonProgress } = await import("@/db/schema");
    const lp = await db
      .select({ chapterId: lessonProgress.chapterId })
      .from(lessonProgress)
      .where(eq(lessonProgress.studentId, studentId));
    completedChapterIds = lp.map((r) => r.chapterId);
  } catch { completedChapterIds = []; }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = studentRuns.some((r) => new Date(r.run.createdAt) >= today);
  const totalRuns = studentRuns.length;
  const safeRuns = studentRuns.filter((r) => r.run.status === "completed").length;
  const flags = studentRuns.filter((r) => r.run.status === "flagged").length;
  const earnedBadges = [...CORE_CHAPTERS, ...BONUS_CHAPTERS].filter((c) =>
    completedChapterIds.includes(c.id)
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header className="h-16 flex items-center justify-between px-6" style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}>
        <div className="flex items-center gap-3">
          <Link href={`/teacher/classrooms/${classroomId}`} style={{ color: "#3DA5F4" }}
            className="p-2 rounded-block flex items-center gap-1 font-sans text-sm font-extrabold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {classroom.name}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Student header */}
        <div className="rounded-card p-6" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}>
          <div className="flex items-center gap-4">
            <AvatarChip name={student.displayName} size={52} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>{student.displayName}</h1>
                <span>{activeToday ? "🟢" : "⚪"}</span>
              </div>
              <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
                {activeToday ? "Active today" : "Not active today"}
              </p>
            </div>
          </div>
        </div>

        <StudentKpis totalRuns={totalRuns} safeRuns={safeRuns} flags={flags} workerCount={studentProjects.length} />

        <RunLimitBar usage={usage} />

        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>AI WORKERS</div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>{studentProjects.length} built</h2>
          </div>
          <StudentWorkers projects={studentProjects} runs={studentRuns} />
        </section>

        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>RECENT RUNS</div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>Last {studentRuns.length}</h2>
          </div>
          <StudentRunsTable runs={studentRuns} />
        </section>

        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>LESSON BADGES</div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>{completedChapterIds.length} earned</h2>
          </div>
          {earnedBadges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((c) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-pill text-sm font-sans font-extrabold"
                  style={{ background: c.badge.bg, color: "#2A2A3C", border: `2px solid ${c.color}33` }}>
                  {c.badge.emoji} {c.badge.name}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#8A8071" }} className="font-sans text-sm">No lesson progress yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
