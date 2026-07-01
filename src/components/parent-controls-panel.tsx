"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WorkerRow {
  id: string;
  name: string;
  parentApprovedAt: string | null;
}

interface Props {
  studentId: string;
  initialDailyLimit: number;
  runsUsedToday: number;
  initialPaused: boolean;
  initialEmailOnFlag: boolean;
  initialRequireApproval: boolean;
  workers: WorkerRow[];
}

export function ParentControlsPanel(props: Props) {
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState(props.initialDailyLimit);
  const [paused, setPaused] = useState(props.initialPaused);
  const [requireApproval, setRequireApproval] = useState(props.initialRequireApproval);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 1800);
  };

  const patchLimits = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      const res = await fetch(`/api/parent/children/${props.studentId}/limits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Saved ✓");
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const patchPrefs = async (body: Record<string, unknown>) => {
    setBusy("prefs");
    try {
      const res = await fetch(`/api/parent/children/${props.studentId}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Saved ✓");
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const approveWorker = async (id: string) => {
    setBusy(`approve-${id}`);
    try {
      const res = await fetch(`/api/parent/projects/${id}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Approved ✓");
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const deleteWorker = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/parent/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Deleted ✓");
      router.refresh();
    } catch (e) {
      flash(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const pendingWorkers = props.workers.filter((w) => !w.parentApprovedAt);

  return (
    <div className="space-y-6">
      {note && (
        <div
          className="rounded-block px-4 py-2 text-center font-sans text-sm font-extrabold"
          style={{ background: "#D1FAE5", color: "#2E9B52" }}
        >
          {note}
        </div>
      )}

      {/* Controls card */}
      <div
        className="rounded-card p-6"
        style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
          CONTROLS
        </div>

        {/* Daily limit stepper */}
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Daily run limit</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
              {props.runsUsedToday} of {dailyLimit} used today
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = Math.max(1, dailyLimit - 1);
                setDailyLimit(next);
                patchLimits({ dailyRunLimit: next }, "limit");
              }}
              disabled={busy !== null || dailyLimit <= 1}
              className="w-9 h-9 rounded-full font-extrabold text-lg disabled:opacity-40"
              style={{ background: "#F4F0FF", color: "#7C5CFF" }}
            >
              −
            </button>
            <div className="font-display text-2xl font-semibold w-10 text-center" style={{ color: "#2A2A3C" }}>
              {dailyLimit}
            </div>
            <button
              onClick={() => {
                const next = Math.min(50, dailyLimit + 1);
                setDailyLimit(next);
                patchLimits({ dailyRunLimit: next }, "limit");
              }}
              disabled={busy !== null || dailyLimit >= 50}
              className="w-9 h-9 rounded-full font-extrabold text-lg disabled:opacity-40"
              style={{ background: "#F4F0FF", color: "#7C5CFF" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Pause switch */}
        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
              {paused ? "🔴 Paused" : "🟢 Runs enabled"}
            </div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
              Kill switch — blocks all AI Worker runs until you turn it back on.
            </div>
          </div>
          <Toggle
            checked={paused}
            disabled={busy !== null}
            onChange={(v) => {
              setPaused(v);
              patchLimits({ paused: v }, "pause");
            }}
          />
        </div>

        {/* Reset today */}
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Reset today's counter</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
              Give them a fresh {dailyLimit} runs for the rest of today.
            </div>
          </div>
          <button
            onClick={() => patchLimits({ resetToday: true }, "reset")}
            disabled={busy !== null || props.runsUsedToday === 0}
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40"
            style={{ background: "#FF924D", boxShadow: "0 3px 0 #CC6B2A" }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Preferences card */}
      <div
        className="rounded-card p-6"
        style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
          PREFERENCES
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="min-w-0 flex-1 pr-4">
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Approve each new worker first</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>
              New AI Workers can't run until you approve them below.
            </div>
          </div>
          <Toggle
            checked={requireApproval}
            disabled={busy !== null}
            onChange={(v) => {
              setRequireApproval(v);
              patchPrefs({ requireApproval: v });
            }}
          />
        </div>
      </div>

      {/* Workers list */}
      <div
        className="rounded-card p-6"
        style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
      >
        <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>
          AI WORKERS · {props.workers.length}
          {requireApproval && pendingWorkers.length > 0 && (
            <span style={{ color: "#E0792B" }}> · {pendingWorkers.length} AWAITING APPROVAL</span>
          )}
        </div>

        {props.workers.length === 0 ? (
          <div className="font-sans text-sm text-center py-4" style={{ color: "#8A8071" }}>
            No workers yet.
          </div>
        ) : (
          <div className="space-y-2">
            {props.workers.map((w) => {
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
                      onClick={() => approveWorker(w.id)}
                      disabled={busy !== null}
                      className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs text-white disabled:opacity-40"
                      style={{ background: "#46C46A", boxShadow: "0 3px 0 #2E9B52" }}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => deleteWorker(w.id, w.name)}
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
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 transition-colors disabled:opacity-40"
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        background: checked ? "#46C46A" : "#D6CFC0",
      }}
    >
      <span
        className="absolute top-1 transition-all"
        style={{
          left: checked ? 22 : 4,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}
