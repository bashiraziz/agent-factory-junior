import Link from "next/link";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";

type FlaggedRun = {
  run: {
    id: string;
    projectId: string;
    createdAt: Date;
    status: string;
  };
  studentName: string | null;
  projectName: string | null;
};

export function FlaggedRuns({ runs }: { runs: FlaggedRun[] }) {
  if (runs.length === 0) return null;

  return (
    <section>
      <div className="mb-4">
        <div
          className="font-mono text-xs uppercase tracking-widest mb-1"
          style={{ color: "#E0792B" }}
        >
          ⚠ RECENT SAFETY FLAGS
        </div>
        <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
          {runs.length} run{runs.length !== 1 ? "s" : ""} need review
        </h2>
      </div>
      <div className="space-y-3">
        {runs.slice(0, 5).map(({ run, studentName, projectName }) => (
          <div
            key={run.id}
            className="rounded-card p-4 flex items-center gap-4"
            style={{ background: "#FFF9EE", border: "2px solid #FFC53D44" }}
          >
            <AvatarChip name={studentName || "?"} size={36} />
            <div className="flex-1 min-w-0">
              <div
                className="font-sans font-extrabold text-sm"
                style={{ color: "#2A2A3C" }}
              >
                {studentName || "Unknown"} · {projectName || "Unknown worker"}
              </div>
              <div
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "#8A8071" }}
              >
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
  );
}
