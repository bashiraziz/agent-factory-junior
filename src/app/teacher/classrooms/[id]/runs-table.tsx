import Link from "next/link";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";

type EnrichedRun = {
  run: {
    id: string;
    projectId: string;
    createdAt: Date;
    status: string;
  };
  studentName: string | null;
  projectName: string | null;
};

export function ClassroomRunsTable({
  runs,
  totalCount,
}: {
  runs: EnrichedRun[];
  totalCount: number;
}) {
  return (
    <section>
      <div className="mb-4">
        <div
          className="font-mono text-xs uppercase tracking-widest mb-1"
          style={{ color: "#8A8071" }}
        >
          RECENT RUNS
        </div>
        <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
          {totalCount} run{totalCount !== 1 ? "s" : ""}
        </h2>
      </div>
      {runs.length === 0 ? (
        <div
          className="rounded-card p-8 text-center"
          style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
        >
          <div className="font-sans" style={{ color: "#8A8071" }}>
            No runs yet — students haven&apos;t run any AI Workers in this classroom.
          </div>
        </div>
      ) : (
        <div
          className="rounded-card overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "2px solid #F0E7D6",
            boxShadow: "0 4px 12px rgba(58,46,28,.08)",
          }}
        >
          <div
            className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-widest"
            style={{
              background: "#FBF6EC",
              borderBottom: "2px solid #F0E7D6",
              color: "#8A8071",
            }}
          >
            <div>STUDENT</div>
            <div>AI WORKER</div>
            <div>WHEN</div>
            <div>STATUS</div>
            <div>ACTION</div>
          </div>
          {runs.map(({ run, studentName, projectName }) => {
            const isFlagged = run.status === "flagged";
            return (
              <div
                key={run.id}
                className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center border-b last:border-b-0"
                style={{
                  borderColor: "#F0E7D6",
                  background: isFlagged ? "#FFF9EE" : "transparent",
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AvatarChip name={studentName || "?"} size={28} />
                  <span
                    className="font-sans text-sm truncate"
                    style={{ color: "#2A2A3C" }}
                  >
                    {studentName || "Unknown"}
                  </span>
                </div>
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
                  {new Date(run.createdAt).toLocaleTimeString("en-US", {
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
      )}
    </section>
  );
}
