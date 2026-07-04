"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface GalleryProject {
  id: string;
  name: string;
  description: string | null;
  shareStatus: string | null;
  ownerId: string;
  ownerName: string | null;
}

function ProjectCard({
  item,
  onAction,
}: {
  item: GalleryProject;
  onAction: (id: string, action: "approve" | "reject" | "remove") => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  async function act(action: "approve" | "reject" | "remove") {
    setLoading(true);
    await onAction(item.id, action);
    setLoading(false);
  }

  return (
    <div
      className="rounded-card p-5 flex flex-col gap-3"
      style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-block flex items-center justify-center text-xl flex-shrink-0" style={{ background: "#F4F0FF" }}>
          🤖
        </div>
        <div className="min-w-0">
          <div className="font-display text-base truncate" style={{ color: "#2A2A3C" }}>{item.name}</div>
          <div className="font-sans text-xs mt-0.5" style={{ color: "#8A8071" }}>
            By {(item.ownerName ?? "Student").split(" ")[0]}
          </div>
        </div>
      </div>

      {item.description && (
        <p className="font-sans text-sm line-clamp-2" style={{ color: "#5C5747" }}>{item.description}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/student/projects/${item.id}/run`}
          target="_blank"
          className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs"
          style={{ background: "#F4F0FF", color: "#7C5CFF" }}
        >
          Preview →
        </Link>
        {item.shareStatus === "pending" && (
          <>
            <button
              disabled={loading}
              onClick={() => act("approve")}
              className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs text-white"
              style={{ background: "#46C46A", boxShadow: "0 2px 0 #2E9B52" }}
            >
              Approve ✓
            </button>
            <button
              disabled={loading}
              onClick={() => act("reject")}
              className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs text-white"
              style={{ background: "#E5393A", boxShadow: "0 2px 0 #B02020" }}
            >
              Reject ✗
            </button>
          </>
        )}
        {item.shareStatus === "approved" && (
          <button
            disabled={loading}
            onClick={() => act("remove")}
            className="px-3 py-1.5 rounded-pill font-sans font-extrabold text-xs"
            style={{ background: "#FFF0F0", color: "#C0443A", border: "1.5px solid #FFCCCC" }}
          >
            Remove from gallery
          </button>
        )}
      </div>
    </div>
  );
}

export default function TeacherGalleryPage() {
  const { id: classroomId } = useParams<{ id: string }>();
  const router = useRouter();
  const [pending, setPending] = useState<GalleryProject[]>([]);
  const [approved, setApproved] = useState<GalleryProject[]>([]);
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch(`/api/teacher/classrooms/${classroomId}/gallery`);
    if (r.status === 401 || r.status === 403) { router.push("/sign-in"); return; }
    const data = await r.json();
    setPending(data.pending ?? []);
    setApproved(data.approved ?? []);
    setLoading(false);
  }, [classroomId, router]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(projectId: string, action: "approve" | "reject" | "remove") {
    await fetch(`/api/teacher/projects/${projectId}/approve-share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  }

  const items = tab === "pending" ? pending : approved;

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header className="h-16 flex items-center justify-between px-6" style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}>
        <div className="flex items-center gap-3">
          <Link href={`/teacher/classrooms/${classroomId}`} className="p-2 rounded-block" style={{ color: "#3DA5F4" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>🖼 Gallery</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="flex gap-3">
          {(["pending", "approved"] as const).map((t) => {
            const count = t === "pending" ? pending.length : approved.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm transition-colors"
                style={{
                  background: tab === t ? "#7C5CFF" : "#F0E7D6",
                  color: tab === t ? "#FFFFFF" : "#5C5747",
                }}
              >
                {t === "pending" ? "Pending" : "Approved"}{" "}
                {count > 0 && (
                  <span
                    className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: t === "pending" && tab !== t ? "#E0792B" : "rgba(255,255,255,0.3)", color: tab === t ? "#fff" : "#E0792B" }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-20 text-4xl animate-pulse">🖼</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">🎉</div>
            <p className="font-sans" style={{ color: "#8A8071" }}>
              {tab === "pending" ? "No Workers waiting for review." : "No approved Workers yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <ProjectCard key={item.id} item={item} onAction={handleAction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
