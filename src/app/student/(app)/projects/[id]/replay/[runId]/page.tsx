import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { replays, agentRuns, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";
import { ReplayCard } from "@/components/replay-card";

export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) redirect("/join");

  const [replay] = await db
    .select()
    .from(replays)
    .where(and(eq(replays.runId, runId), eq(replays.projectId, id)));

  if (!replay) notFound();

  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId));
  const [project] = await db.select().from(projects).where(eq(projects.id, id));

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#FBF6EC" }}>
      <div className="max-w-lg mx-auto">
        <Link
          href={`/student/projects/${id}/run`}
          className="inline-flex items-center gap-1 font-sans text-sm font-extrabold mb-6"
          style={{ color: "#7C5CFF" }}
        >
          ← Back to run
        </Link>

        <ReplayCard replay={replay} run={run} project={project} />

        <div className="text-center mt-6">
          <Link
            href={`/student/projects/${id}/edit`}
            className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
          >
            ← Back to Editor
          </Link>
        </div>
      </div>
    </div>
  );
}
