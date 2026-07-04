import Link from "next/link";

type Project = {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
};

type RunRow = {
  run: { id: string; projectId: string; createdAt: Date; status: string };
  projectName: string | null;
};

function lastRunForProject(projectId: string, runs: RunRow[]) {
  return runs.find((r) => r.run.projectId === projectId) ?? null;
}

function statusDot(status: string) {
  if (status === "published") return "🟢";
  return "⚪";
}

export function StudentWorkers({
  projects,
  runs,
}: {
  projects: Project[];
  runs: RunRow[];
}) {
  if (projects.length === 0) {
    return (
      <div
        className="rounded-card p-8 text-center"
        style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
      >
        <div className="font-sans" style={{ color: "#8A8071" }}>
          No AI Workers built yet.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {projects.map((proj) => {
        const lastRun = lastRunForProject(proj.id, runs);
        return (
          <div
            key={proj.id}
            className="rounded-card p-4 flex flex-col gap-2"
            style={{
              background: "#FFFFFF",
              border: "2px solid #F0E7D6",
              boxShadow: "0 4px 12px rgba(58,46,28,.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <span>{statusDot(proj.status)}</span>
              <span
                className="font-sans font-extrabold text-sm"
                style={{ color: "#2A2A3C" }}
              >
                {proj.name}
              </span>
            </div>
            <div
              className="font-mono text-[10px] uppercase tracking-widest"
              style={{ color: "#8A8071" }}
            >
              {proj.status === "published" ? "Published" : "Draft"} · Updated{" "}
              {new Date(proj.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
            {lastRun && (
              <Link
                href={`/student/projects/${proj.id}/replay/${lastRun.run.id}`}
                className="font-sans font-extrabold text-xs px-3 py-1.5 rounded-pill self-start"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                Replay last run →
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
