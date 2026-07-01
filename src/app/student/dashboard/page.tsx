import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { projects, usageLimits } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Mascot } from "@/components/mascot";
import { StatusPill } from "@/components/status-pill";
import { AvatarChip } from "@/components/avatar-chip";
import { resolveStudentProfile } from "@/lib/student-auth";
import { DeleteWorkerButton } from "@/components/delete-worker-button";
import { LogoutButton } from "@/components/logout-button";
import { HelpButton } from "@/components/help-button";

export default async function StudentDashboard() {
  const profile = await resolveStudentProfile();
  if (!profile) redirect("/join");
  if (profile.role !== "student") redirect(`/${profile.role}/dashboard`);

  const myProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, profile.id))
    .orderBy(desc(projects.updatedAt))
    .limit(6);

  const [usage] = await db.select().from(usageLimits).where(eq(usageLimits.userId, profile.id));
  const runsLeft = usage ? usage.dailyRunLimit - usage.runsUsedToday : 5;
  const runsLimit = usage?.dailyRunLimit ?? 5;

  const firstName = profile.displayName.split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      {/* Top nav */}
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#7C5CFF" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.6" />
              <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.9" />
            </svg>
          </div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Agent Factory <span style={{ color: "#7C5CFF" }}>Junior</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1 rounded-pill font-mono text-xs font-bold"
            style={{ background: "#F4F0FF", color: "#7C5CFF" }}
          >
            {runsLeft} RUNS LEFT TODAY
          </div>
          <HelpButton
            screenKey="student-dashboard"
            title="Your dashboard"
            tips={[
              { icon: "🤖", title: "New AI Worker", body: "Click + New AI Worker to start building a helper with visual blocks." },
              { icon: "▶", title: "Run a worker", body: "Green Run button uses one of your daily runs. You get 5 per day." },
              { icon: "✏", title: "Edit or delete", body: "Edit changes the blocks. The trash icon on each card deletes the worker permanently." },
              { icon: "❓", title: "Full guide", body: "Tap 'See full help' for detailed instructions and safety info." },
            ]}
          />
          <LogoutButton />
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Greeting */}
        <div className="flex items-center gap-5">
          <Mascot size={72} />
          <div>
            <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
              Hey, {firstName}! 👋
            </h1>
            <p className="font-sans text-lg mt-1" style={{ color: "#5C5747" }}>
              Ready to build something amazing today?
            </p>
          </div>
        </div>

        {/* Usage bar */}
        <div
          className="rounded-card p-5 flex items-center gap-6"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
        >
          <div className="flex-1">
            <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#8A8071" }}>
              RUNS TODAY
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#F0E7D6" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((runsLimit - runsLeft) / runsLimit) * 100)}%`,
                  background: "#46C46A",
                }}
              />
            </div>
            <div className="font-sans text-sm mt-2" style={{ color: "#5C5747" }}>
              {runsLimit - runsLeft} of {runsLimit} runs used
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold" style={{ color: "#46C46A" }}>
              {runsLeft}
            </div>
            <div className="font-sans text-xs" style={{ color: "#8A8071" }}>remaining</div>
          </div>
        </div>

        {/* My AI Workers */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                MY AI WORKERS
              </div>
              <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                {myProjects.length > 0 ? `${myProjects.length} worker${myProjects.length !== 1 ? "s" : ""} built` : "No workers yet"}
              </h2>
            </div>
            <Link
              href="/student/projects/new"
              className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-white flex items-center gap-2 transition-transform hover:-translate-y-0.5"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              <span>+</span> New AI Worker
            </Link>
          </div>

          {myProjects.length === 0 ? (
            <div
              className="rounded-card p-10 text-center relative overflow-hidden"
              style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F4F0FF 100%)", border: "2px dashed #7C5CFF44" }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="afj-float text-6xl">🤖</div>
                <div
                  className="relative afj-pop-in rounded-2xl px-4 py-3 font-sans text-sm font-extrabold"
                  style={{ background: "#FFFFFF", border: "2px solid #7C5CFF33", color: "#2A2A3C", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
                >
                  Hey {firstName}! Let&apos;s build your first AI Worker! <span className="text-lg">🚀</span>
                </div>
              </div>
              <p className="font-sans mb-6" style={{ color: "#5C5747" }}>
                Snap some blocks together, give it a Goal + Safety Rule, and watch your creation come alive.
              </p>
              <Link
                href="/student/projects/new"
                className="afj-wiggle inline-flex items-center gap-2 px-7 py-3.5 rounded-pill font-sans font-extrabold text-white afj-glow"
                style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
              >
                <span className="text-xl">✨</span> Start building →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-card p-5 flex flex-col gap-3"
                  style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-block flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: "#F4F0FF" }}
                    >
                      🤖
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusPill status={project.status === "draft" ? "safe" : "safe"} />
                      <DeleteWorkerButton id={project.id} name={project.name} />
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold leading-snug" style={{ color: "#2A2A3C" }}>
                      {project.name}
                    </div>
                    {project.description && (
                      <div className="font-sans text-sm mt-1 line-clamp-2" style={{ color: "#5C5747" }}>
                        {project.description}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>
                    {project.status === "draft" ? "DRAFT" : "PUBLISHED"} · {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 mt-auto pt-1">
                    <Link
                      href={`/student/projects/${project.id}/edit`}
                      className="flex-1 py-2 text-center rounded-pill font-sans font-extrabold text-sm transition-transform hover:-translate-y-0.5"
                      style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/student/projects/${project.id}/run`}
                      className="flex-1 py-2 text-center rounded-pill font-sans font-extrabold text-sm text-white transition-transform hover:-translate-y-0.5"
                      style={{ background: "#46C46A", boxShadow: "0 3px 0 #2E9B52" }}
                    >
                      Run ▶
                    </Link>
                  </div>
                </div>
              ))}

              {/* Create new card */}
              <Link
                href="/student/projects/new"
                className="rounded-card p-5 flex flex-col items-center justify-center gap-3 transition-colors hover:border-brand"
                style={{ background: "#FFFDF7", border: "2px dashed #F0E7D6", minHeight: "180px" }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                >
                  +
                </div>
                <span className="font-sans font-extrabold text-sm" style={{ color: "#7C5CFF" }}>
                  New AI Worker
                </span>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
