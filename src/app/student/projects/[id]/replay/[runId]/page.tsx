import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { replays, agentRuns, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";

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

  const runDate = new Date(replay.createdAt);
  const dateStr = runDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = runDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const knowledgeUsed = (replay.knowledgeUsed as string[]) || [];
  const rulesApplied = (replay.rulesApplied as string[]) || [];
  const stepsFollowed = (replay.stepsFollowed as string[]) || [];
  const toolsUsed = (replay.toolsUsed as string[]) || [];
  const approvalRequired = (replay.approvalRequired as string[]) || [];
  const safetyFlags = (replay.safetyFlags as string[]) || [];

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

        <div style={{ filter: "drop-shadow(0 18px 50px rgba(58,46,28,.15))" }}>
          <div
            className="rounded-t-card px-6 pt-8 pb-6 text-center"
            style={{ background: "#2A2A3C" }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "#8A8071" }}>
              AGENT FACTORY JUNIOR
            </div>
            <div className="font-display text-3xl font-semibold mb-3" style={{ color: "#FFFFFF" }}>
              Replay
            </div>
            <div className="font-mono text-xs" style={{ color: "#8A8071" }}>
              RUN #{runId.slice(0, 8).toUpperCase()} · {dateStr.toUpperCase()} · {timeStr}
            </div>
          </div>

          <div
            style={{
              height: "12px",
              background: "#2A2A3C",
              maskImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, white 8px, white 16px)",
              WebkitMaskImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, white 8px, white 16px)",
            }}
          />
          <div
            style={{
              height: "12px",
              background: "#FFFFFF",
              maskImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, white 8px, white 16px)",
              WebkitMaskImage: "repeating-linear-gradient(90deg, transparent 0px, transparent 8px, white 8px, white 16px)",
            }}
          />

          <div
            className="px-6 py-6 space-y-4"
            style={{ background: "#FFFFFF", fontFamily: '"Space Mono", monospace', fontSize: "12px" }}
          >
            <ReplayRow label="AI WORKER" value={project?.name || "Unknown"} />
            <ReplayDots />
            <ReplayRow label="GOAL" value={replay.goal || "—"} />
            <ReplayDots />

            <div>
              <div style={{ color: "#8A8071" }}>KNOWLEDGE USED</div>
              {knowledgeUsed.length > 0 ? (
                knowledgeUsed.map((k, i) => (
                  <div key={i} className="mt-1" style={{ color: "#2A2A3C" }}>· {k}</div>
                ))
              ) : (
                <div style={{ color: "#8A8071" }}>None</div>
              )}
            </div>
            <ReplayDots />

            <div>
              <div style={{ color: "#8A8071" }}>RULES APPLIED</div>
              {rulesApplied.length > 0 ? (
                rulesApplied.map((r, i) => (
                  <div key={i} className="mt-1 flex items-start gap-2" style={{ color: "#2A2A3C" }}>
                    <span style={{ color: "#46C46A" }}>✓</span> {r}
                  </div>
                ))
              ) : (
                <div style={{ color: "#8A8071" }}>None</div>
              )}
            </div>
            <ReplayDots />

            <div>
              <div style={{ color: "#8A8071" }}>STEPS FOLLOWED</div>
              {stepsFollowed.length > 0 ? (
                stepsFollowed.map((s, i) => (
                  <div key={i} className="mt-1" style={{ color: "#2A2A3C" }}>{i + 1}. {s}</div>
                ))
              ) : (
                <div style={{ color: "#8A8071" }}>None</div>
              )}
            </div>
            <ReplayDots />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div style={{ color: "#8A8071" }}>TOOLS USED</div>
                <div style={{ color: "#2A2A3C" }}>{toolsUsed.length > 0 ? toolsUsed.join(", ") : "None"}</div>
              </div>
              <div>
                <div style={{ color: "#8A8071" }}>APPROVAL REQ.</div>
                <div style={{ color: "#2A2A3C" }}>{approvalRequired.length > 0 ? approvalRequired.join(", ") : "None"}</div>
              </div>
            </div>
            <ReplayDots />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div style={{ color: "#8A8071" }}>SAFETY FLAGS</div>
                <div style={{ color: safetyFlags.length > 0 ? "#E0792B" : "#46C46A" }}>
                  {safetyFlags.length > 0 ? safetyFlags.join(", ") : "NONE ✓"}
                </div>
              </div>
              <div>
                <div style={{ color: "#8A8071" }}>MODEL</div>
                <div style={{ color: "#2A2A3C" }}>{(run?.provider || "mock").toUpperCase()}</div>
              </div>
            </div>

            <div style={{ borderTop: "2px solid #2A2A3C", marginTop: "16px", marginBottom: "16px" }} />

            <div
              className="text-center py-3 rounded-block"
              style={{ background: "#D1FAE5", border: "2px solid #46C46A44" }}
            >
              <div className="font-mono text-xs font-bold" style={{ color: "#2E9B52" }}>
                ● EVERYTHING THIS WORKER DID IS SHOWN ABOVE
              </div>
            </div>

            {replay.output && (
              <>
                <ReplayDots />
                <div>
                  <div style={{ color: "#8A8071" }}>OUTPUT DELIVERED</div>
                  <div className="mt-1" style={{ color: "#2A2A3C", lineHeight: 1.6 }}>
                    {(replay.output as string).slice(0, 300)}
                    {(replay.output as string).length > 300 ? "…" : ""}
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            style={{
              height: "12px",
              background: "#FFFFFF",
              maskImage: "repeating-linear-gradient(90deg, white 0px, white 8px, transparent 8px, transparent 16px)",
              WebkitMaskImage: "repeating-linear-gradient(90deg, white 0px, white 8px, transparent 0px, transparent 16px)",
            }}
          />
          <div className="rounded-b-card py-4 text-center" style={{ background: "#FBF6EC" }}>
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>
              AGENT FACTORY JUNIOR · POWERED BY {(run?.provider || "mock").toUpperCase()}
            </div>
          </div>
        </div>

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

function ReplayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <div style={{ color: "#8A8071", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ color: "#2A2A3C", textAlign: "right", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

function ReplayDots() {
  return <div style={{ borderTop: "2px dotted #F0E7D6", margin: "4px 0" }} />;
}
