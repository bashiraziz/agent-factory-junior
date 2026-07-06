"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascot";

export default function ConnectPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function joinClass() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Invalid code");
      }
      router.push("/student/dashboard");
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFDF7" }}>
      <div className="w-full max-w-lg space-y-8 text-center">

        <div className="flex justify-center">
          <Mascot size={80} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-3xl" style={{ color: "#2A2A3C" }}>
            One more step 🔒
          </h1>
          <p className="font-sans text-base" style={{ color: "#5C5747", maxWidth: 400, margin: "0 auto" }}>
            Agent Factory Foundations is for supervised learners. Connect with a teacher or a parent to start building.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-left">
          {/* Class code card */}
          <div
            className="rounded-card p-6 space-y-4"
            style={{ background: "#fff", border: "2px solid #F0E7D6", boxShadow: "0 6px 18px rgba(58,46,28,.08)" }}
          >
            <div className="text-3xl">🏫</div>
            <div className="font-display text-lg" style={{ color: "#2A2A3C" }}>I have a class code</div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. BLUE-7742"
              maxLength={12}
              className="w-full px-4 py-3 rounded-xl font-mono text-base"
              style={{ background: "#FBF6EC", border: "2px solid #F0E7D6", color: "#2A2A3C", outline: "none" }}
              onKeyDown={(e) => e.key === "Enter" && joinClass()}
            />
            {error && (
              <p className="font-sans text-sm" style={{ color: "#E0792B" }}>{error}</p>
            )}
            <button
              onClick={joinClass}
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-pill font-sans font-extrabold text-base text-white disabled:opacity-40"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              {loading ? "Joining…" : "Join class →"}
            </button>
          </div>

          {/* Parent card */}
          <div
            className="rounded-card p-6 space-y-4"
            style={{ background: "#fff", border: "2px solid #F0E7D6", boxShadow: "0 6px 18px rgba(58,46,28,.08)" }}
          >
            <div className="text-3xl">👨‍👩‍👧</div>
            <div className="font-display text-lg" style={{ color: "#2A2A3C" }}>Tell my parent</div>
            <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
              Ask a parent or guardian to visit{" "}
              <strong>agentfactoryfoundations.com/parent</strong> and add you as their student.
              Once they&apos;ve linked your account, tap Refresh below.
            </p>
            <button
              onClick={() => router.refresh()}
              className="w-full py-3 rounded-pill font-sans font-extrabold text-base"
              style={{ background: "#F4F0FF", color: "#7C5CFF", border: "2px solid #EDE4F8" }}
            >
              Refresh ↺
            </button>
          </div>
        </div>

        <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
          Need help? Ask your teacher or a grown-up.
        </p>
      </div>
    </main>
  );
}
