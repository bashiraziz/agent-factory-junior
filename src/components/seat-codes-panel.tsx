"use client";

import { useState, useEffect, useCallback } from "react";

interface SeatCode {
  id: string;
  code: string;
  isActive: boolean;
  joinedAt: string | null;
  nickname: string | null;
}

export function SeatCodesPanel({ classroomId }: { classroomId: string }) {
  const [codes, setCodes] = useState<SeatCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [count, setCount] = useState(10);

  const fetchCodes = useCallback(async () => {
    const res = await fetch(`/api/classrooms/${classroomId}/seat-codes`);
    if (res.ok) setCodes(await res.json());
    setLoading(false);
  }, [classroomId]);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const generate = async () => {
    setGenerating(true);
    await fetch(`/api/classrooms/${classroomId}/seat-codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    await fetchCodes();
    setGenerating(false);
  };

  const deactivate = async (codeId: string) => {
    await fetch(`/api/classrooms/${classroomId}/seat-codes`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codeId }),
    });
    setCodes((prev) => prev.map((c) => c.id === codeId ? { ...c, isActive: false } : c));
  };

  const active = codes.filter((c) => c.isActive);
  const used = active.filter((c) => !!c.joinedAt);
  const available = active.filter((c) => !c.joinedAt);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            SEAT CODES — TRACK A
          </div>
          <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
            {loading ? "…" : `${available.length} available · ${used.length} in use`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="px-3 py-2 rounded-[11px] font-sans text-sm outline-none"
            style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>{n} codes</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white disabled:opacity-60"
            style={{ background: "#46C46A", boxShadow: "0 4px 0 #2E9B52" }}
          >
            {generating ? "Generating…" : "+ Generate"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="font-sans text-sm" style={{ color: "#8A8071" }}>Loading codes…</div>
      ) : codes.length === 0 ? (
        <div
          className="rounded-card p-8 text-center"
          style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
        >
          <div className="text-4xl mb-3">🎟️</div>
          <div className="font-display text-lg mb-1" style={{ color: "#2A2A3C" }}>No seat codes yet</div>
          <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
            Generate codes and hand them to students. No account needed — they just go to <strong>/join</strong>.
          </p>
        </div>
      ) : (
        <div
          className="rounded-card overflow-hidden"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
        >
          <div
            className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 font-mono text-[10px] uppercase tracking-widest"
            style={{ background: "#FBF6EC", borderBottom: "2px solid #F0E7D6", color: "#8A8071" }}
          >
            <div>CODE</div>
            <div>STUDENT</div>
            <div>STATUS</div>
            <div></div>
          </div>
          {codes.map((seat) => (
            <div
              key={seat.id}
              className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 items-center border-b last:border-b-0"
              style={{ borderColor: "#F0E7D6", opacity: seat.isActive ? 1 : 0.45 }}
            >
              <div
                className="font-mono text-sm font-bold tracking-widest px-3 py-1 rounded-pill"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                {seat.code}
              </div>
              <div className="font-sans text-sm" style={{ color: "#2A2A3C" }}>
                {seat.nickname ?? <span style={{ color: "#8A8071" }}>—</span>}
              </div>
              <div>
                {!seat.isActive ? (
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#8A8071" }}>inactive</span>
                ) : seat.joinedAt ? (
                  <span
                    className="px-2.5 py-1 rounded-pill font-mono text-[10px] uppercase font-bold tracking-widest"
                    style={{ background: "#E8F9EE", color: "#2E9B52" }}
                  >
                    joined
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-1 rounded-pill font-mono text-[10px] uppercase font-bold tracking-widest"
                    style={{ background: "#FBF6EC", color: "#8A8071" }}
                  >
                    waiting
                  </span>
                )}
              </div>
              <div>
                {seat.isActive && (
                  <button
                    onClick={() => deactivate(seat.id)}
                    className="font-sans text-xs hover:underline"
                    style={{ color: "#E0792B" }}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
