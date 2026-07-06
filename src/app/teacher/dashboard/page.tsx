import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  profiles,
  classrooms,
  classroomMembers,
  agentRuns,
  projects,
  providerKeys,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { LogoutButton } from "@/components/logout-button";
import { HelpButton } from "@/components/help-button";
import { BYOKEntryCard } from "@/components/byok-entry-card";
import { FlaggedRuns } from "./flagged-runs";
import { ClassroomsGrid } from "./classrooms-grid";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "teacher") redirect(`/${profile.role}/dashboard`);

  const myClassrooms = await db.select().from(classrooms)
    .where(eq(classrooms.teacherId, profile.id)).orderBy(desc(classrooms.createdAt));

  const allMembers = myClassrooms.length
    ? await db.select().from(classroomMembers)
        .where(inArray(classroomMembers.classroomId, myClassrooms.map((c) => c.id)))
    : [];
  const studentIds = Array.from(new Set(allMembers.map((m) => m.studentId)));

  const enrichedRuns = studentIds.length
    ? await db.select({ run: agentRuns, studentName: profiles.displayName, projectName: projects.name })
        .from(agentRuns)
        .leftJoin(profiles, eq(agentRuns.studentId, profiles.id))
        .leftJoin(projects, eq(agentRuns.projectId, projects.id))
        .where(inArray(agentRuns.studentId, studentIds))
        .orderBy(desc(agentRuns.createdAt))
        .limit(20)
    : [];

  const memberCounts = myClassrooms.map((c) => ({
    classroom: c,
    count: allMembers.filter((m) => m.classroomId === c.id).length,
  }));
  const totalStudents = studentIds.length;
  const flaggedRuns = enrichedRuns.filter((r) => r.run.status === "flagged");
  const firstName = profile.displayName.split(" ")[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeStudentsToday = new Set(
    enrichedRuns.filter((r) => new Date(r.run.createdAt) >= today).map((r) => r.run.studentId)
  ).size;

  const classroomRunStats = myClassrooms.map((c) => {
    const ids = allMembers.filter((m) => m.classroomId === c.id).map((m) => m.studentId);
    const cRuns = enrichedRuns.filter((r) => ids.includes(r.run.studentId));
    return {
      classroomId: c.id,
      todayCount: cRuns.filter((r) => new Date(r.run.createdAt) >= today).length,
      flagCount: cRuns.filter((r) => r.run.status === "flagged").length,
    };
  });

  const [pk] = await db.select().from(providerKeys).where(eq(providerKeys.ownerProfileId, profile.id));

  const kpiTiles = [
    { label: "Classrooms", value: myClassrooms.length, color: "#3DA5F4", icon: "🏫" },
    { label: "Students", value: totalStudents, color: "#9B6DFF", icon: "🎓" },
    { label: "Total Runs", value: enrichedRuns.length, color: "#46C46A", icon: "▶" },
    { label: "Flags to Review", value: flaggedRuns.length, color: "#E0792B", icon: "⚠" },
    { label: "Active Today", value: activeStudentsToday, color: "#46C46A", icon: "🟢" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header className="h-16 flex items-center justify-between px-6" style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-block flex items-center justify-center" style={{ background: "#3DA5F4" }}>
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
            <div className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white" style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}>
              + New Classroom
            </div>
          </Link>
          <HelpButton screenKey="teacher-dashboard" title="Teacher Hub" tips={[
            { icon: "🏫", title: "Create a classroom", body: "Click + New Classroom, give it a name, and share the join code with students." },
            { icon: "🎓", title: "Students join with a code", body: "Students go to /join and enter your code — no email needed for students." },
            { icon: "⚠", title: "Safety flags", body: "Any run that trips a safety rule appears in the review list. Click Review to see what happened." },
            { icon: "📊", title: "Per-classroom view", body: "Click a classroom card to see today's runs, students, and seat codes." },
          ]} />
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>WELCOME BACK</div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>Hey, {firstName}! 👩‍🏫</h1>
          <p className="font-sans text-lg mt-1" style={{ color: "#5C5747" }}>
            {totalStudents} student{totalStudents !== 1 ? "s" : ""} across {myClassrooms.length} classroom{myClassrooms.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpiTiles.map((tile) => (
            <div key={tile.label} className="rounded-card p-5" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}>
              <div className="text-2xl mb-2">{tile.icon}</div>
              <div className="font-display text-3xl font-semibold" style={{ color: tile.color }}>{tile.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>{tile.label}</div>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>MY CLASSROOMS</div>
              <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                {myClassrooms.length > 0 ? `${myClassrooms.length} active` : "No classrooms yet"}
              </h2>
            </div>
            <Link href="/teacher/classrooms/new" className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-white" style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}>
              + New Classroom
            </Link>
          </div>
          <ClassroomsGrid classrooms={myClassrooms} memberCounts={memberCounts} runStats={classroomRunStats} />
        </section>

        <section>
          <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>AI KEY</div>
          <BYOKEntryCard connected={!!pk} keyTail={pk?.keyTail ?? null} status={pk?.status ?? null} />
        </section>

        <FlaggedRuns runs={flaggedRuns} />
      </main>
    </div>
  );
}
