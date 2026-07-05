"use client";

import { useState } from "react";

export function AdminDemoResetButton() {
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [deleted, setDeleted] = useState(0);

  async function handleReset() {
    if (!confirm("Reset demo data now? This deletes all child accounts added by demo visitors (the seeded alex_demo child is kept).")) return;
    setState("running");
    try {
      const res = await fetch("/api/admin/demo-reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleted(data.deleted);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="rounded-card p-6 flex items-center justify-between gap-4"
      style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
    >
      <div>
        <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
          Demo account reset
        </div>
        <div className="font-sans text-sm mt-0.5" style={{ color: "#5C5747" }}>
          Wipes child accounts added by demo visitors. The seeded <span className="font-mono">alex_demo</span> child is always kept.
          Also runs automatically every 4 days via cron.
        </div>
        {state === "done" && (
          <div className="font-sans text-sm mt-2 font-bold" style={{ color: "#2E9B52" }}>
            ✓ Done — {deleted} account{deleted !== 1 ? "s" : ""} removed.
          </div>
        )}
        {state === "error" && (
          <div className="font-sans text-sm mt-2 font-bold" style={{ color: "#EF5A5A" }}>
            Something went wrong — check server logs.
          </div>
        )}
      </div>
      <button
        onClick={handleReset}
        disabled={state === "running"}
        className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-sm flex-shrink-0 disabled:opacity-50"
        style={{ background: "#FFF6E0", color: "#92400E", border: "2px solid #FFC53D" }}
      >
        {state === "running" ? "Resetting…" : "Reset now"}
      </button>
    </div>
  );
}
