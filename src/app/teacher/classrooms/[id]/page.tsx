import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SeatCodesPanel } from "@/components/seat-codes-panel";
import { db } from "@/db";
import {
  profiles,
  classrooms,
  classroomMembers,
  agentRuns,
  projects,
} from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { LogoutButton } from "@/components/logout-button";
import { HelpButton } from "@/components/help-button";
import { WeekChart } from "./week-chart";
import { StudentTable } from "./student-table";
import { ClassroomRunsTable } from "./runs-table";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
    .where(and(eq(classrooms.id, id), eq(classrooms.teacherId, profile.id)));
  if (!classroom) notFound();

  const members = await db
    .select()
    .from(classroomMembers)
    .where(eq(classroomMembers.classroomId, id));
  const studentIds = members.map((m) => m.studentId);

  const classroomRuns = studentIds.length
    ? await db
        .select()
        .from(agentRuns)
        .where(inArray(agentRuns.studentId, studentIds))
        .orderBy(desc(agentRuns.createdAt))
        .limit(50)
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRuns = classroomRuns.filter((r) => new Date(r.createdAt) >= today);
  const safeRuns = todayRuns.filter((r) => r.status === "completed");
  const flaggedRuns = classroomRuns.filter((r) => r.status === "flagged");

  const classroomProjects = studentIds.length
    ? await db.select().from(projects).where(inArray(projects.ownerId, studentIds))
    : [];

  const studentProfiles = studentIds.length
    ? await db.select().from(profiles).where(inArray(profiles.id, studentIds))
    : [];

  const enrichedRuns = studentIds.length
    ? await db
        .select({ run: agentRuns, studentName: profiles.displayName, projectName: projects.name })
        .from(agentRuns)
        .leftJoin(profiles, eq(agentRuns.studentId, profiles.id))
        .leftJoin(projects, eq(agentRuns.projectId, projects.id))
        .where(inArray(agentRuns.studentId, studentIds))
        .orderBy(desc(agentRuns.createdAt))
        .limit(50)
    : [];

  const studentRows = studentProfiles
    .map((student) => {
      const sRuns = classroomRuns.filter((r) => r.studentId === student.id);
      const todayStudentRuns = sRuns.filter((r) => new Date(r.createdAt) >= today);
      const flagCount = sRuns.filter((r) => r.status === "flagged").length;
      const workerCount = classroomProjects.filter((p) => p.ownerId === student.id).length;
      const bars = Array.from({ length: 7 }, (_, i) => {
        const ds = new Date(Date.now() - (6 - i) * 86400000);
        ds.setHours(0, 0, 0, 0);
        const de = new Date(ds.getTime() + 86400000);
        return sRuns.filter((r) => { const t = new Date(r.createdAt).getTime(); return t >= ds.getTime() && t < de.getTime(); }).length;
      });
      const lastRun = sRuns[0]?.createdAt ?? null;
      const activeToday = todayStudentRuns.length > 0;
      const lastRunDaysAgo = lastRun ? Math.floor((Date.now() - new Date(lastRun).getTime()) / 86400000) : null;
      return { student, runsToday: todayStudentRuns.length, totalRuns: sRuns.length, flagCount, workerCount, lastRun, activeToday, bars, maxBar: Math.max(...bars, 1), lastRunDaysAgo };
    })
    .sort((a, b) => {
      if (a.activeToday !== b.activeToday) return a.activeToday ? -1 : 1;
      if (!a.lastRun && !b.lastRun) return 0;
      if (!a.lastRun) return 1;
      if (!b.lastRun) return -1;
      return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
    });

  const pendingShares = studentIds.length
    ? await db.select({ id: projects.id }).from(projects)
        .where(and(inArray(projects.ownerId, studentIds), eq(projects.shareStatus, "pending")))
    : [];
  const pendingCount = pendingShares.length;

  let lessonProgressMap: Record<string, number> = {};
  try {
    const { lessonProgress } = await import("@/db/schema");
    if (studentIds.length) {
      const lp = await db.select({ studentId: lessonProgress.studentId, chapterId: lessonProgress.chapterId })
        .from(lessonProgress).where(inArray(lessonProgress.studentId, studentIds));
      for (const row of lp) lessonProgressMap[row.studentId] = (lessonProgressMap[row.studentId] ?? 0) + 1;
    }
  } catch { lessonProgressMap = {}; }

  const classroomDayBars = Array.from({ length: 7 }, (_, i) => {
    const ds = new Date(Date.now() - (6 - i) * 86400000);
    ds.setHours(0, 0, 0, 0);
    const de = new Date(ds.getTime() + 86400000);
    const label = ds.toLocaleDateString("en-US", { weekday: "short" });
    const count = classroomRuns.filter((r) => { const t = new Date(r.createdAt).getTime(); return t >= ds.getTime() && t < de.getTime(); }).length;
    return { label, count };
  });
  const maxClassBar = Math.max(...classroomDayBars.map((b) => b.count), 1);

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header className="h-16 flex items-center justify-between px-6" style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}>
        <div className="flex items-center gap-3">
          <Link href="/teacher/classrooms" style={{ color: "#3DA5F4" }} className="p-2 rounded-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>Classroom</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/teacher/classrooms/${id}/gallery`}
            className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-sm transition-colors"
            style={{ background: pendingCount > 0 ? "#FFF0E0" : "#F0E7D6", color: pendingCount > 0 ? "#E0792B" : "#5C5747" }}
          >
            🖼 Gallery{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Link>
          <HelpButton screenKey="teacher-classroom" title="Classroom detail" tips={[
            { icon: "🔑", title: "Join code", body: "Share the code so students can join." },
            { icon: "🎟", title: "Seat codes", body: "Pre-generate codes for kids without email." },
            { icon: "👀", title: "Recent runs", body: "Click Replay to see exactly what happened." },
            { icon: "⚠", title: "Flagged runs", body: "Yellow rows tripped a safety rule — click Review first." },
            { icon: "🖼", title: "Gallery", body: "Students can share their finished Workers. You approve or reject from the Gallery tab before classmates see them." },
          ]} />
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="rounded-card p-6" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-[22px] font-semibold" style={{ color: "#2A2A3C" }}>{classroom.name}</h1>
              <p className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
                {members.length} student{members.length !== 1 ? "s" : ""} · {classroomProjects.length} AI Workers built
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>JOIN CODE</div>
              <div className="px-4 py-2 rounded-pill font-mono text-xl font-bold tracking-widest" style={{ background: "#F4F0FF", color: "#7C5CFF", letterSpacing: "0.15em" }}>
                {classroom.joinCode}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Runs Today", value: todayRuns.length, color: "#7C5CFF" },
            { label: "Safe Runs", value: safeRuns.length, color: "#46C46A" },
            { label: "Flags to Review", value: flaggedRuns.length, color: "#E0792B" },
            { label: "Workers Built", value: classroomProjects.length, color: "#3DA5F4" },
          ].map((tile) => (
            <div key={tile.label} className="rounded-card p-5 text-center" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}>
              <div className="font-display text-4xl font-semibold" style={{ color: tile.color }}>{tile.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>{tile.label}</div>
            </div>
          ))}
        </div>

        <WeekChart bars={classroomDayBars} maxBar={maxClassBar} />

        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>STUDENTS</div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>{studentRows.length} enrolled</h2>
          </div>
          <StudentTable rows={studentRows} classroomId={id} lessonProgressMap={lessonProgressMap} />
        </section>

        <ClassroomRunsTable runs={enrichedRuns} totalCount={classroomRuns.length} />

        <SeatCodesPanel classroomId={id} />
      </main>
    </div>
  );
}
