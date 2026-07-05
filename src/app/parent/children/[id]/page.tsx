import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, parentChildLinks, agentRuns, projects, classroomMembers, classrooms, usageLimits } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";
import { ParentControlsPanel } from "@/components/parent-controls-panel";
import { ChildDangerZone } from "@/components/child-danger-zone";

export default async function ParentChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "parent") redirect(`/${profile.role}/dashboard`);

  // Verify this is a linked child
  const [link] = await db
    .select()
    .from(parentChildLinks)
    .where(and(eq(parentChildLinks.parentId, profile.id), eq(parentChildLinks.studentId, id)));

  if (!link) notFound();

  const [child] = await db.select().from(profiles).where(eq(profiles.id, id));
  if (!child) notFound();

  // Recent runs
  const recentRuns = await db
    .select()
    .from(agentRuns)
    .where(eq(agentRuns.studentId, id))
    .orderBy(desc(agentRuns.createdAt))
    .limit(20);

  // Enrich runs with project names
  const enrichedRuns = await Promise.all(
    recentRuns.map(async (run) => {
      const [proj] = await db.select().from(projects).where(eq(projects.id, run.projectId));
      return { run, project: proj };
    })
  );

  // Find classroom
  const memberRows = await db.select().from(classroomMembers).where(eq(classroomMembers.studentId, id));
  const classroomName =
    memberRows.length > 0
      ? await db
          .select()
          .from(classrooms)
          .where(eq(classrooms.id, memberRows[0].classroomId))
          .then((rows) => rows[0]?.name || "Unknown Room")
      : null;

  // Weekly stats — last 7 days
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekRuns = recentRuns.filter((r) => new Date(r.createdAt) >= weekAgo);
  const safeCount = weekRuns.filter((r) => r.status === "completed").length;

  // Build 7-day bar chart data
  const dayBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = weekRuns.filter((r) => {
      const rd = new Date(r.createdAt);
      return rd >= d && rd < nextDay;
    }).length;
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), count };
  });

  const maxBarCount = Math.max(1, ...dayBars.map((b) => b.count));

  // Controls state: usage limits + child's workers
  const [usage] = await db.select().from(usageLimits).where(eq(usageLimits.userId, id));
  const childProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, id))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/parent/children" style={{ color: "#18B5A0" }} className="p-2 rounded-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>{child.displayName}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Child header card */}
        <div
          className="rounded-card p-6 flex items-center gap-5"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
        >
          <AvatarChip name={child.displayName} size={50} />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-[22px] font-semibold" style={{ color: "#2A2A3C" }}>
              {child.displayName}&apos;s projects
            </h1>
            <div className="font-mono text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "#8A8071" }}>
              LINKED CHILD{classroomName ? ` · ROOM ${classroomName.toUpperCase()}` : ""} · THIS WEEK
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-display text-3xl font-semibold" style={{ color: "#46C46A" }}>
              {safeCount}/{weekRuns.length}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              SAFE RUNS
            </div>
          </div>
        </div>

        {/* Usage summary */}
        <div
          className="rounded-card p-6"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            THIS WEEK · {weekRuns.length} RUNS
          </div>
          <div className="font-display text-xl mb-4" style={{ color: "#2A2A3C" }}>
            {weekRuns.length === 0
              ? "No runs yet this week"
              : safeCount === weekRuns.length
              ? "All within daily limits ✓"
              : `${safeCount} safe, ${weekRuns.length - safeCount} flagged`}
          </div>

          {/* 7-bar weekly chart */}
          <div className="flex items-end gap-2 h-16">
            {dayBars.map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(4, (bar.count / maxBarCount) * 48)}px`,
                    background: bar.count > 0 ? "#7C5CFF" : "#F0E7D6",
                  }}
                />
                <div className="font-mono text-[9px]" style={{ color: "#8A8071" }}>
                  {bar.day.slice(0, 1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent runs */}
        <section>
          <div className="mb-4">
            <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
              RECENT RUNS
            </div>
            <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
              {enrichedRuns.length} total
            </h2>
          </div>

          {enrichedRuns.length === 0 ? (
            <div
              className="rounded-card p-8 text-center"
              style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
            >
              <div className="font-sans" style={{ color: "#8A8071" }}>
                No runs yet. Your child hasn't run any AI Workers.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {enrichedRuns.map(({ run, project: proj }) => {
                const status = run.status === "completed" ? "safe" : run.status === "flagged" ? "flagged" : "error";
                return (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 rounded-card px-5 py-4"
                    style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
                  >
                    {/* Colored icon */}
                    <div
                      className="w-10 h-10 rounded-block flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background: status === "safe" ? "#D1FAE5" : status === "flagged" ? "#FFF1DC" : "#FEE2E2",
                      }}
                    >
                      {status === "safe" ? "✅" : status === "flagged" ? "⚠" : "❌"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-sans font-extrabold text-sm truncate" style={{ color: "#2A2A3C" }}>
                        {proj?.name || "Unknown Worker"}
                      </div>
                      <div className="font-sans text-xs truncate" style={{ color: "#5C5747" }}>
                        {run.output ? run.output.slice(0, 60) + "…" : "No output"}
                      </div>
                    </div>

                    <StatusPill status={status} />

                    <Link
                      href={`/student/projects/${run.projectId}/replay/${run.id}`}
                      className="font-sans font-extrabold text-xs px-3 py-1.5 rounded-pill flex-shrink-0"
                      style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                    >
                      Replay →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Parent controls */}
        <ParentControlsPanel
          studentId={id}
          initialDailyLimit={usage?.dailyRunLimit ?? 5}
          runsUsedToday={usage?.runsUsedToday ?? 0}
          initialPaused={usage?.paused ?? false}
          initialEmailOnFlag={link.emailOnFlag ?? false}
          initialEmailWeeklyReport={link.emailWeeklyReport ?? false}
          initialRequireApproval={link.requireApproval ?? false}
          workers={childProjects.map((p) => ({
            id: p.id,
            name: p.name,
            parentApprovedAt: p.parentApprovedAt ? new Date(p.parentApprovedAt).toISOString() : null,
          }))}
        />

        {/* Reassurance strip */}
        <div
          className="rounded-card p-5 flex items-start gap-4"
          style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
        >
          <div className="text-3xl flex-shrink-0">🛡</div>
          <div>
            <div className="font-sans font-extrabold" style={{ color: "#2A2A3C" }}>
              You can see exactly what every AI Worker did
            </div>
            <div className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
              Every step, every rule applied, every answer — all shown in the Replay. Nothing is hidden from you as a parent.
            </div>
          </div>
        </div>

        {/* Gap 3: COPPA data deletion */}
        <ChildDangerZone childId={id} childName={child.displayName} />
      </main>
    </div>
  );
}
