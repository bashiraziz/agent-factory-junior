import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { StatusPill } from "@/components/status-pill";
import { AvatarChip } from "@/components/avatar-chip";
import { DeleteWorkerButton } from "@/components/delete-worker-button";
import { resolveStudentProfile } from "@/lib/student-auth";

export default async function StudentProjects() {
  const profile = await resolveStudentProfile();
  if (!profile) redirect("/join");
  if (profile.role !== "student") redirect(`/${profile.role}/dashboard`);

  const myProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, profile.id))
    .orderBy(desc(projects.updatedAt));

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/student/dashboard" className="p-2 rounded-block hover:bg-paper-sunken transition-colors" style={{ color: "#7C5CFF" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>My AI Workers</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/student/projects/new"
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
          >
            + New
          </Link>
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            MY AI WORKERS
          </div>
          <h1 className="font-display text-3xl" style={{ color: "#2A2A3C" }}>
            {myProjects.length} worker{myProjects.length !== 1 ? "s" : ""}
          </h1>
        </div>

        {myProjects.length === 0 ? (
          <div
            className="rounded-card p-12 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(180deg,#FFFFFF 0%,#F4F0FF 100%)", border: "2px dashed #7C5CFF44" }}
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="afj-float text-7xl">🤖</div>
              <div
                className="afj-pop-in rounded-2xl px-4 py-3 font-sans text-sm font-extrabold"
                style={{ background: "#FFFFFF", border: "2px solid #7C5CFF33", color: "#2A2A3C", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
              >
                Your robot friends live here! <span className="text-lg">🤝</span>
              </div>
            </div>
            <div className="font-display text-2xl mb-2" style={{ color: "#2A2A3C" }}>
              Ready to build one?
            </div>
            <p className="font-sans mb-6" style={{ color: "#5C5747" }}>
              Pick a template or start blank — your first AI Worker is a couple of clicks away.
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
          <div className="space-y-3">
            {myProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-card p-5 flex items-center gap-4"
                style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
              >
                <div
                  className="w-12 h-12 rounded-block flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "#F4F0FF" }}
                >
                  🤖
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg font-semibold truncate" style={{ color: "#2A2A3C" }}>
                    {project.name}
                  </div>
                  {project.description && (
                    <div className="font-sans text-sm truncate" style={{ color: "#5C5747" }}>
                      {project.description}
                    </div>
                  )}
                  <div className="font-mono text-xs uppercase tracking-widest mt-1" style={{ color: "#8A8071" }}>
                    Updated {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>

                <StatusPill status="safe" />

                <div className="flex items-center gap-2 flex-shrink-0">
                  <DeleteWorkerButton id={project.id} name={project.name} />
                  <Link
                    href={`/student/projects/${project.id}/edit`}
                    className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm transition-transform hover:-translate-y-0.5"
                    style={{ background: "#F4F0FF", color: "#7C5CFF" }}
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/student/projects/${project.id}/run`}
                    className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white transition-transform hover:-translate-y-0.5"
                    style={{ background: "#46C46A", boxShadow: "0 3px 0 #2E9B52" }}
                  >
                    Run ▶
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
