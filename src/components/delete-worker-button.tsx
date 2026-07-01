"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteWorkerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={handleDelete}
          disabled={busy}
          className="px-3 py-2 rounded-pill font-sans font-extrabold text-xs text-white transition-opacity disabled:opacity-50"
          style={{ background: "#E5393A", boxShadow: "0 3px 0 #A82424" }}
        >
          {busy ? "…" : "Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-2 rounded-pill font-sans font-extrabold text-xs"
          style={{ background: "#F0E7D6", color: "#5C5747" }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Delete "${name}"`}
      className="w-9 h-9 rounded-block flex items-center justify-center transition-colors flex-shrink-0"
      style={{ color: "#C0443A" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FFF0F0"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
      </svg>
    </button>
  );
}
