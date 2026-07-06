"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toggle } from "./toggle";
import { WorkersList } from "./parent-controls-workers";

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
  initialEmailWeeklyReport: boolean;
  initialRequireApproval: boolean;
  workers: WorkerRow[];
}

export function ParentControlsPanel(props: Props) {
  const router = useRouter();
  const [dailyLimit, setDailyLimit] = useState(props.initialDailyLimit);
  const [paused, setPaused] = useState(props.initialPaused);
  const [requireApproval, setRequireApproval] = useState(props.initialRequireApproval);
  const [emailWeekly, setEmailWeekly] = useState(props.initialEmailWeeklyReport);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const flash = (msg: string) => { setNote(msg); setTimeout(() => setNote(null), 1800); };

  const patchLimits = async (body: Record<string, unknown>, label: string) => {
    setBusy(label);
    try {
      const res = await fetch(`/api/parent/students/${props.studentId}/limits`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Saved ✓"); router.refresh();
    } catch (e) { flash(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  };

  const patchPrefs = async (body: Record<string, unknown>) => {
    setBusy("prefs");
    try {
      const res = await fetch(`/api/parent/students/${props.studentId}/preferences`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Saved ✓"); router.refresh();
    } catch (e) { flash(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  };

  const approveWorker = async (id: string) => {
    setBusy(`approve-${id}`);
    try {
      const res = await fetch(`/api/parent/projects/${id}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Approved ✓"); router.refresh();
    } catch (e) { flash(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  };

  const deleteWorker = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(`del-${id}`);
    try {
      const res = await fetch(`/api/parent/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      flash("Deleted ✓"); router.refresh();
    } catch (e) { flash(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      {note && (
        <div className="rounded-block px-4 py-2 text-center font-sans text-sm font-extrabold" style={{ background: "#D1FAE5", color: "#2E9B52" }}>
          {note}
        </div>
      )}

      {/* Controls card */}
      <div className="rounded-card p-6" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}>
        <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>CONTROLS</div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Daily run limit</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>{props.runsUsedToday} of {dailyLimit} used today</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const n = Math.max(1, dailyLimit - 1); setDailyLimit(n); patchLimits({ dailyRunLimit: n }, "limit"); }} disabled={busy !== null || dailyLimit <= 1} className="w-9 h-9 rounded-full font-extrabold text-lg disabled:opacity-40" style={{ background: "#F4F0FF", color: "#7C5CFF" }}>−</button>
            <div className="font-display text-2xl font-semibold w-10 text-center" style={{ color: "#2A2A3C" }}>{dailyLimit}</div>
            <button onClick={() => { const n = Math.min(50, dailyLimit + 1); setDailyLimit(n); patchLimits({ dailyRunLimit: n }, "limit"); }} disabled={busy !== null || dailyLimit >= 50} className="w-9 h-9 rounded-full font-extrabold text-lg disabled:opacity-40" style={{ background: "#F4F0FF", color: "#7C5CFF" }}>+</button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>{paused ? "🔴 Paused" : "🟢 Runs enabled"}</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>Kill switch — blocks all AI Worker runs until you turn it back on.</div>
          </div>
          <Toggle checked={paused} disabled={busy !== null} onChange={(v) => { setPaused(v); patchLimits({ paused: v }, "pause"); }} />
        </div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Reset today&apos;s counter</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>Give them a fresh {dailyLimit} runs for the rest of today.</div>
          </div>
          <button onClick={() => patchLimits({ resetToday: true }, "reset")} disabled={busy !== null || props.runsUsedToday === 0} className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40" style={{ background: "#FF924D", boxShadow: "0 3px 0 #CC6B2A" }}>Reset</button>
        </div>

        <ChangePinRow studentId={props.studentId} busy={busy} setBusy={setBusy} flash={flash} />
      </div>

      {/* Preferences card */}
      <div className="rounded-card p-6" style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}>
        <div className="font-mono text-[10px] uppercase tracking-widest mb-4" style={{ color: "#8A8071" }}>PREFERENCES</div>

        <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #F0E7D6" }}>
          <div className="min-w-0 flex-1 pr-4">
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Approve each new worker first</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>New AI Workers can&apos;t run until you approve them below.</div>
          </div>
          <Toggle checked={requireApproval} disabled={busy !== null} onChange={(v) => { setRequireApproval(v); patchPrefs({ requireApproval: v }); }} />
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="min-w-0 flex-1 pr-4">
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Weekly learning report</div>
            <div className="font-sans text-xs" style={{ color: "#5C5747" }}>Get a summary email every Sunday with runs, badges, and lesson progress.</div>
          </div>
          <Toggle checked={emailWeekly} disabled={busy !== null} onChange={(v) => { setEmailWeekly(v); patchPrefs({ emailWeeklyReport: v }); }} />
        </div>
      </div>

      <WorkersList workers={props.workers} requireApproval={requireApproval} busy={busy} onApprove={approveWorker} onDelete={deleteWorker} />
    </div>
  );
}

function ChangePinRow({ studentId, busy, setBusy, flash }: { studentId: string; busy: string | null; setBusy: (v: string | null) => void; flash: (msg: string) => void; }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async () => {
    if (!/^\d{4}$/.test(pin)) { setError("Enter exactly 4 digits."); inputRef.current?.focus(); return; }
    setError(null); setBusy("pin");
    try {
      const res = await fetch(`/api/parent/students/${studentId}/pin`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setPin(""); flash("PIN changed ✓");
    } catch (e) { flash(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(null); }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>Change PIN</div>
        <div className="font-sans text-xs" style={{ color: "#5C5747" }}>Let them sign in with a new 4-digit code.</div>
        {error && <div className="font-sans text-xs mt-1" style={{ color: "#C0443A" }}>{error}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} value={pin}
          onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPin(v); if (error) setError(null); }}
          placeholder="••••" disabled={busy !== null}
          className="w-16 text-center font-mono text-sm rounded-block px-2 py-2 disabled:opacity-40"
          style={{ border: "2px solid #D6CFC0", background: "#FBF6EC", color: "#2A2A3C" }}
        />
        <button onClick={handleChange} disabled={busy !== null || pin.length !== 4} className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-40" style={{ background: "#7C5CFF", boxShadow: "0 3px 0 #5A3ECC" }}>Change</button>
      </div>
    </div>
  );
}
