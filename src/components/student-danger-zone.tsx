"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudentDangerZone({ childId, childName }: { childId: string; childName: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/parent/students/${childId}/delete`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push("/parent/students");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ borderTop: "2px solid #F0E7D6", paddingTop: 24, marginTop: 32 }}>
      <h3 className="font-display text-lg font-semibold" style={{ color: "#EF5A5A" }}>
        Danger zone
      </h3>
      <p className="font-sans text-sm mt-1 mb-4" style={{ color: "#5C5747" }}>
        Permanently delete {childName}&apos;s account and all their data — workers, runs, badges,
        everything. This cannot be undone.
      </p>

      {error && (
        <div className="mb-3 p-3 rounded-xl font-sans text-sm" style={{ background: "#FFE9E9", color: "#C43A3A" }}>
          {error}
        </div>
      )}

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-6 py-3 rounded-pill font-sans font-extrabold text-sm"
          style={{ background: "#FFE9E9", color: "#EF5A5A", border: "2px solid #EF5A5A55" }}
        >
          Delete {childName}&apos;s account…
        </button>
      ) : (
        <div
          className="rounded-card p-5 space-y-4"
          style={{ background: "#FFE9E9", border: "2px solid #EF5A5A55" }}
        >
          <p className="font-sans text-sm font-bold" style={{ color: "#C43A3A" }}>
            Are you absolutely sure? Type DELETE to confirm.
          </p>
          <input
            type="text"
            placeholder="Type DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-2 rounded-xl font-mono"
            style={{ border: "2px solid #EF5A5A55", background: "#FFF" }}
          />
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== "DELETE"}
              className="px-6 py-2 rounded-pill font-bold text-white disabled:opacity-40"
              style={{ background: "#EF5A5A" }}
            >
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(""); }}
              className="px-6 py-2 rounded-pill font-bold"
              style={{ color: "#8A8071" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
