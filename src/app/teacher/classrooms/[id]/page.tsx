import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SeatCodesPanel } from "@/components/seat-codes-panel";
import { db } from "@/db";
import { profiles, classrooms, classroomMembers, agentRuns, projects } from "@/db/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";
import { LogoutButton } from "@/components/logout-button";
import { HelpButton } from "@/components/help-button";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect(`/${profile.role}/dashboard`);

  const [classroom] = await db
    .select()
    .from(classrooms)
    .where(and(eq(classrooms.id, id), eq(classrooms.teacherId, profile.id)));

  if (!classroom) notFound();

  // Members
  const members = await db
    .select()
    .from(classroomMembers)
    .where(eq(classroomMembers.classroomId, id));

  const studentProfiles = await Promise.all(
    members.map(async (m) => {
      const [student] = await db.select().from(profiles).where(eq(profiles.id, m.studentId));
      return student;
    })
  );

  // Today's runs for this classroom's students
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studentIds = members.map((m) => m.studentId);

  // Get runs scoped to this classroom's students only
  const classroomRuns = studentIds.length
    ? await db
        .select()
        .from(agentRuns)
        .where(inArray(agentRuns.studentId, studentIds))
        .orderBy(desc(agentRuns.createdAt))
        .limit(50)
    : [];
  const todayRuns = classroomRuns.filter((r) => new Date(r.createdAt) >= today);
  const safeRuns = todayRuns.filter((r) => r.status === "completed");
  const flaggedRuns = classroomRuns.filter((r) => r.status === "flagged");

  // Get project count for this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekProjects = await db
    .select()
    .from(projects)
    .where(gte(projects.createdAt, weekAgo));
  const classroomProjects = weekProjects.filter((p) => studentIds.includes(p.ownerId));

  // Enrich runs
  const enrichedRuns = await Promise.all(
    classroomRuns.slice(0, 20).map(async (run) => {
      const student = studentProfiles.find((s) => s?.id === run.studentId);
      const [proj] = await db.select().from(projects).where(eq(projects.id, run.projectId));
      return { run, student, project: proj };
    })
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/teacher/classrooms" style={{ color: "#3DA5F4" }} className="p-2 rounded-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>Classroom</span>
        </div>
        <div className="flex items-center gap-3">
          <HelpButton
            screenKey="teacher-classroom"
            title="Classroom detail"
            tips={[
              { icon: "🔑", title: "Join code", body: "Share the code shown at the top-right so students can join this classroom." },
              { icon: "🎟", title: "Seat codes", body: "Pre-generate codes for kids without email. Each seat activates when the student joins." },
              { icon: "👀", title: "Recent runs", body: "See every run a student in this classroom did. Click Replay to see exactly what happened." },
              { icon: "⚠", title: "Flagged runs", body: "Yellow highlighted rows are runs that tripped a safety rule — click Review first." },
            ]}
          />
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Classroom header */}
        <div
          className="rounded-card p-6"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-[22px] font-semibold" style={{ color: "#2A2A3C" }}>
                {classroom.name}
              </h1>
              <p className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
                {members.length} student{members.length !== 1 ? "s" : ""} · {classroomProjects.length} AI Workers built this week
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                JOIN CODE
              </div>
              <div
                className="px-4 py-2 rounded-pill font-mono text-xl font-bold tracking-widest"
                style={{ background: "#F4F0FF", color: "#7C5CFF", letterSpacing: "0.15em" }}
              >
                {classroom.joinCode}
              </div>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Runs Today", value: todayRuns.length, color: "#7C5CFF" },
            { label: "Safe Runs", value: safeRuns.length, color: "#46C46A" },
            { label: "Flags to Review", value: flaggedRuns.length, color: "#E0792B" },
            { label: "Workers Built", value: classroomProjects.length, color: "#3DA5F4" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-card p-5 text-center"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
            >
              <div className="font-display text-4xl font-semibold" style={{ color: tile.color }}>
                {tile.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>

        {/* Runs table */}
        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
              RECENT RUNS
            </div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
              {classroomRuns.length} run{classroomRuns.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {enrichedRuns.length === 0 ? (
            <div
              className="rounded-card p-8 text-center"
              style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
            >
              <div className="font-sans" style={{ color: "#8A8071" }}>
                No runs yet — students haven't run any AI Workers in this classroom.
              </div>
            </div>
          ) : (
            <div
              className="rounded-card overflow-hidden"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-widest"
                style={{ background: "#FBF6EC", borderBottom: "2px solid #F0E7D6", color: "#8A8071" }}
              >
                <div>STUDENT</div>
                <div>AI WORKER</div>
                <div>WHEN</div>
                <div>STATUS</div>
                <div>ACTION</div>
              </div>

              {enrichedRuns.map(({ run, student, project: proj }) => {
                const isFlagged = run.status === "flagged";
                return (
                  <div
                    key={run.id}
                    className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center border-b last:border-b-0"
                    style={{
                      borderColor: "#F0E7D6",
                      background: isFlagged ? "#FFF9EE" : "transparent",
                    }}
                  >
                    {/* Student */}
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarChip name={student?.displayName || "?"} size={28} />
                      <span className="font-sans text-sm truncate" style={{ color: "#2A2A3C" }}>
                        {student?.displayName || "Unknown"}
                      </span>
                    </div>

                    {/* AI Worker */}
                    <div className="font-sans text-sm truncate" style={{ color: "#2A2A3C" }}>
                      {proj?.name || "Unknown worker"}
                    </div>

                    {/* When */}
                    <div className="font-mono text-[10px]" style={{ color: "#8A8071", whiteSpace: "nowrap" }}>
                      {new Date(run.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>

                    {/* Status */}
                    <StatusPill
                      status={
                        run.status === "completed" ? "safe" :
                        run.status === "flagged" ? "flagged" : "error"
                      }
                    />

                    {/* Action */}
                    <Link
                      href={`/student/projects/${run.projectId}/replay/${run.id}`}
                      className="font-sans font-extrabold text-xs px-3 py-1.5 rounded-pill whitespace-nowrap"
                      style={{
                        background: isFlagged ? "#FFF1DC" : "#F4F0FF",
                        color: isFlagged ? "#E0792B" : "#7C5CFF",
                      }}
                    >
                      {isFlagged ? "Review →" : "Replay →"}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Seat codes — Track A */}
        <SeatCodesPanel classroomId={id} />

        {/* Students list */}
        {members.length > 0 && (
          <section>
            <div className="mb-4">
              <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                STUDENTS
              </div>
              <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                {members.length} enrolled
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {studentProfiles.filter(Boolean).map((student) => (
                <div
                  key={student!.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-pill"
                  style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
                >
                  <AvatarChip name={student!.displayName} size={24} />
                  <span className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
                    {student!.displayName}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
