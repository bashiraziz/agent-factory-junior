import Link from "next/link";
import { StatusPill } from "@/components/status-pill";

type RunRow = {
  run: {
    id: string;
    projectId: string;
    createdAt: Date;
    status: string;
  };
  projectName: string | null;
};

export function StudentRunsTable({ runs }: { runs: RunRow[] }) {
  if (runs.length === 0) {
    return (
      <div
        className="rounded-card p-8 text-center"
        style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
      >
        <div className="font-sans" style={{ color: "#8A8071" }}>
          No runs yet.
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        background: "#FFFFFF",
        border: "2px solid #F0E7D6",
        boxShadow: "0 4px 12px rgba(58,46,28,.08)",
      }}
    >
      <div
        className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-widest"
        style={{
          background: "#FBF6EC",
          borderBottom: "2px solid #F0E7D6",
          color: "#8A8071",
        }}
      >
        <div>WORKER</div>
        <div>WHEN</div>
        <div>STATUS</div>
        <div>ACTION</div>
      </div>
      {runs.map(({ run, projectName }) => {
        const isFlagged = run.status === "flagged";
        return (
          <div
            key={run.id}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center border-b last:border-b-0"
            style={{
              borderColor: "#F0E7D6",
              background: isFlagged ? "#FFF9EE" : "transparent",
            }}
          >
            <div
              className="font-sans text-sm truncate"
              style={{ color: "#2A2A3C" }}
            >
              {projectName || "Unknown worker"}
            </div>
            <div
              className="font-mono text-[10px]"
              style={{ color: "#8A8071", whiteSpace: "nowrap" }}
            >
              {new Date(run.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <StatusPill
              status={
                run.status === "completed"
                  ? "safe"
                  : run.status === "flagged"
                  ? "flagged"
                  : "error"
              }
            />
            <Link
              href={`/student/projects/${run.projectId}/replay/${run.id}`}
              className="font-sans font-extrabold text-xs px-3 py-1.5 rounded-pill whitespace-nowrap"
              style={{
                background: isFlagged ? "#FFF1DC" : "#F4F0FF",
                color: isFlagged ? "#E0792B" : "#7C5CFF",
              }}
            >
              {isFlagged ? "Review →" : "Replay →"}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
