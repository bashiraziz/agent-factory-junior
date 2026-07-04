"use client";

interface WorkerRow {
  id: string;
  name: string;
  parentApprovedAt: string | null;
}

interface Props {
  workers: WorkerRow[];
  requireApproval: boolean;
  busy: string | null;
  onApprove: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

export function WorkersList({ workers, requireApproval, busy, onApprove, onDelete }: Props) {
  const pendingWorkers = workers.filter((w) => !w.parentApprovedAt);

  return (
    <div
      className="rounded-card p-6"
      style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
        AI WORKERS · {workers.length}
        {requireApproval && pendingWorkers.length > 0 && (
          <span style={{ color: "#E0792B" }}> · {pendingWorkers.length} AWAITING APPROVAL</span>
        )}
      </div>

      {workers.length === 0 ? (
        <div className="font-sans text-sm text-center py-4" style={{ color: "#8A8071" }}>
          No workers yet.
        </div>
      ) : (
        <div className="space-y-2">
          {workers.map((w) => {
            const awaiting = requireApproval && !w.parentApprovedAt;
            return (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-block px-4 py-3"
                style={{
                  background: awaiting ? "#FFF6E6" : "#FBF6EC",
                  border: `2px solid ${awaiting ? "#FFC53D66" : "#F0E7D6"}`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-extrabold text-sm truncate" style={{ color: "#2A2A3C" }}>
                    {w.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: awaiting ? "#E0792B" : "#8A8071" }}>
                    {awaiting ? "⏳ Awaiting your approval" : w.parentApprovedAt ? "✓ Approved" : "Not gated"}
                  </div>
                </div>
                {awaiting && (
                  <button
                    onClick={() => onApprove(w.id)}
                    disabled={busy !== null}
                    className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs text-white disabled:opacity-40"
                    style={{ background: "#46C46A", boxShadow: "0 3px 0 #2E9B52" }}
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => onDelete(w.id, w.name)}
                  disabled={busy !== null}
                  className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs disabled:opacity-40"
                  style={{ background: "#FEE2E2", color: "#C0443A" }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
