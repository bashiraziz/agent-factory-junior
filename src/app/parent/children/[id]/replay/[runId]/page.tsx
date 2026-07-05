import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, parentChildLinks, replays, agentRuns, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ReplayCard } from "@/components/replay-card";

export default async function ParentReplayPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id: childId, runId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [parentProfile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!parentProfile || parentProfile.role !== "parent") redirect(`/${parentProfile?.role ?? "sign-in"}/dashboard`);

  const [link] = await db
    .select()
    .from(parentChildLinks)
    .where(and(eq(parentChildLinks.parentId, parentProfile.id), eq(parentChildLinks.studentId, childId)));
  if (!link) notFound();

  const [run] = await db.select().from(agentRuns).where(eq(agentRuns.id, runId));
  if (!run || run.studentId !== childId) notFound();

  const [replay] = await db
    .select()
    .from(replays)
    .where(and(eq(replays.runId, runId), eq(replays.projectId, run.projectId)));

  const [project] = await db.select().from(projects).where(eq(projects.id, run.projectId));

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "#FBF6EC" }}>
      <div className="max-w-lg mx-auto">
        <Link
          href={`/parent/children/${childId}`}
          className="inline-flex items-center gap-1 font-sans text-sm font-extrabold mb-6"
          style={{ color: "#18B5A0" }}
        >
          ← Back to {project ? "child" : "child"}&apos;s profile
        </Link>

        {replay ? (
          <ReplayCard replay={replay} run={run} project={project} />
        ) : (
          <div
            className="rounded-card p-10 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
          >
            <div className="text-5xl mb-4">🎬</div>
            <div className="font-display text-xl mb-2" style={{ color: "#2A2A3C" }}>
              No replay recorded
            </div>
            <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
              This run was completed before detailed replay recording was enabled.
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href={`/parent/children/${childId}`}
            className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#18B5A0", boxShadow: "0 4px 0 #0E8A78" }}
          >
            ← Back to profile
          </Link>
        </div>
      </div>
    </div>
  );
}
