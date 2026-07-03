import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, classrooms, classroomMembers, agentRuns, projects, providerKeys } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";
import { LogoutButton } from "@/components/logout-button";
import { HelpButton } from "@/components/help-button";
import { BYOKEntryCard } from "@/components/byok-entry-card";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect(`/${profile.role}/dashboard`);

  const myClassrooms = await db
    .select()
    .from(classrooms)
    .where(eq(classrooms.teacherId, profile.id))
    .orderBy(desc(classrooms.createdAt));

  // Collect all student IDs across this teacher's classrooms
  const allMembers = myClassrooms.length
    ? await db
        .select()
        .from(classroomMembers)
        .where(
          inArray(
            classroomMembers.classroomId,
            myClassrooms.map((c) => c.id)
          )
        )
    : [];
  const studentIds = Array.from(new Set(allMembers.map((m) => m.studentId)));

  // Get recent runs scoped to this teacher's students only
  const recentRuns = studentIds.length
    ? await db
        .select()
        .from(agentRuns)
        .where(inArray(agentRuns.studentId, studentIds))
        .orderBy(desc(agentRuns.createdAt))
        .limit(10)
    : [];

  // Enrich with student + project names
  const enrichedRuns = await Promise.all(
    recentRuns.map(async (run) => {
      const [student] = await db.select().from(profiles).where(eq(profiles.id, run.studentId));
      const [project] = await db.select().from(projects).where(eq(projects.id, run.projectId));
      return { run, student, project };
    })
  );

  // Total students across my classrooms (derived from allMembers we already fetched)
  const memberCounts = myClassrooms.map((c) => ({
    classroom: c,
    count: allMembers.filter((m) => m.classroomId === c.id).length,
  }));
  const totalStudents = studentIds.length;
  const flaggedRuns = enrichedRuns.filter((r) => r.run.status === "flagged");
  const firstName = profile.displayName.split(" ")[0];

  const [pk] = await db.select().from(providerKeys).where(eq(providerKeys.ownerProfileId, profile.id));

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      {/* Topbar */}
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#3DA5F4" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6M2 12l10 6 10-6" stroke="white" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Teacher <span style={{ color: "#3DA5F4" }}>Hub</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/teacher/classrooms/new">
            <div
              className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white"
              style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
            >
              + New Classroom
            </div>
          </Link>
          <HelpButton
            screenKey="teacher-dashboard"
            title="Teacher Hub"
            tips={[
              { icon: "🏫", title: "Create a classroom", body: "Click + New Classroom, give it a name, and share the join code with students." },
              { icon: "🎓", title: "Students join with a code", body: "Students go to /join and enter your code — no email needed for kids." },
              { icon: "⚠", title: "Safety flags", body: "Any run that trips a safety rule appears in the review list. Click Review to see what happened." },
              { icon: "📊", title: "Per-classroom view", body: "Click a classroom card to see today's runs, students, and seat codes." },
            ]}
          />
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Greeting */}
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            WELCOME BACK
          </div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Hey, {firstName}! 👩‍🏫
          </h1>
          <p className="font-sans text-lg mt-1" style={{ color: "#5C5747" }}>
            {totalStudents} student{totalStudents !== 1 ? "s" : ""} across {myClassrooms.length} classroom{myClassrooms.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Classrooms", value: myClassrooms.length, color: "#3DA5F4", icon: "🏫" },
            { label: "Students", value: totalStudents, color: "#9B6DFF", icon: "🎓" },
            { label: "Total Runs", value: recentRuns.length, color: "#46C46A", icon: "▶" },
            { label: "Flags to Review", value: flaggedRuns.length, color: "#E0792B", icon: "⚠" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-card p-5"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
            >
              <div className="text-2xl mb-2">{tile.icon}</div>
              <div className="font-display text-3xl font-semibold" style={{ color: tile.color }}>
                {tile.value}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>

        {/* My Classrooms */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                MY CLASSROOMS
              </div>
              <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                {myClassrooms.length > 0 ? `${myClassrooms.length} active` : "No classrooms yet"}
              </h2>
            </div>
            <Link
              href="/teacher/classrooms/new"
              className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-white"
              style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
            >
              + New Classroom
            </Link>
          </div>

          {myClassrooms.length === 0 ? (
            <div
              className="rounded-card p-10 text-center"
              style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
            >
              <div className="text-5xl mb-4">🏫</div>
              <div className="font-display text-xl mb-2" style={{ color: "#2A2A3C" }}>
                Create your first classroom
              </div>
              <p className="font-sans mb-5" style={{ color: "#5C5747" }}>
                Students join with a code. You can review their AI Workers and runs.
              </p>
              <Link
                href="/teacher/classrooms/new"
                className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
                style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
              >
                Create Classroom →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClassrooms.map((classroom) => {
                const mc = memberCounts.find((m) => m.classroom.id === classroom.id);
                return (
                  <Link
                    key={classroom.id}
                    href={`/teacher/classrooms/${classroom.id}`}
                    className="rounded-card p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1"
                    style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-10 h-10 rounded-block flex items-center justify-center text-xl"
                        style={{ background: "#EFF7FF" }}
                      >
                        🏫
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-pill font-mono text-[10px] font-bold"
                        style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                      >
                        {classroom.joinCode}
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
                        {classroom.name}
                      </div>
                      <div className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
                        {mc?.count ?? 0} student{mc?.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
                      Created {new Date(classroom.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* BYOK key card */}
        <section>
          <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>
            AI KEY
          </div>
          <BYOKEntryCard
            connected={!!pk}
            keyTail={pk?.keyTail ?? null}
            status={pk?.status ?? null}
          />
        </section>

        {/* Recent safety flags */}
        {flaggedRuns.length > 0 && (
          <section>
            <div className="mb-4">
              <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#E0792B" }}>
                ⚠ RECENT SAFETY FLAGS
              </div>
              <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                {flaggedRuns.length} run{flaggedRuns.length !== 1 ? "s" : ""} need review
              </h2>
            </div>
            <div className="space-y-3">
              {flaggedRuns.slice(0, 5).map(({ run, student, project: proj }) => (
                <div
                  key={run.id}
                  className="rounded-card p-4 flex items-center gap-4"
                  style={{ background: "#FFF9EE", border: "2px solid #FFC53D44" }}
                >
                  <AvatarChip name={student?.displayName || "?"} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
                      {student?.displayName || "Unknown"} · {proj?.name || "Unknown worker"}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
                      {new Date(run.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <StatusPill status="flagged" />
                  <Link
                    href={`/student/projects/${run.projectId}/replay/${run.id}`}
                    className="font-sans font-extrabold text-xs px-3 py-1.5 rounded-pill"
                    style={{ background: "#FFF1DC", color: "#E0792B" }}
                  >
                    Review →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
