"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LinkChildPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/students/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkCode: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to link student");
      setSuccess(data.student?.displayName || "Student linked!");
      setTimeout(() => router.push("/parent/students"), 1500);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center px-6 gap-3"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <Link href="/parent/students" className="p-2 rounded-block" style={{ color: "#18B5A0" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-display text-lg" style={{ color: "#2A2A3C" }}>Link a Student</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-card p-8"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🔗</div>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                Enter Link Code
              </h1>
              <p className="font-sans mt-2" style={{ color: "#5C5747" }}>
                Ask your student for their link code. They can find it in their profile or in their student dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-block font-sans text-sm text-center" style={{ background: "#FFF1DC", color: "#E0792B" }}>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-block font-sans text-sm text-center" style={{ background: "#D1FAE5", color: "#2E9B52" }}>
                ✓ Linked to {success}! Redirecting…
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="code"
                  className="block font-mono text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#8A8071" }}
                >
                  STUDENT'S LINK CODE
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. STAR-42"
                  maxLength={12}
                  required
                  className="w-full px-4 py-3 rounded-block font-mono text-xl text-center uppercase tracking-widest focus:outline-none"
                  style={{
                    background: "#FBF6EC",
                    border: "2px solid #F0E7D6",
                    color: "#2A2A3C",
                    letterSpacing: "0.2em",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#18B5A0"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#F0E7D6"; }}
                />
              </div>

              <div
                className="rounded-block p-4"
                style={{ background: "#F0FDFB", border: "2px solid #18B5A022" }}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#0E8A78" }}>
                  HOW IT WORKS
                </div>
                <ul className="font-sans text-sm space-y-1" style={{ color: "#2A2A3C" }}>
                  <li>🎓 Ask your student for their link code</li>
                  <li>🔗 Enter it above to connect</li>
                  <li>👀 See all their AI Worker activity</li>
                  <li>📋 Watch replays for every run</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={!code.trim() || loading || !!success}
                className="w-full py-3.5 rounded-pill font-sans font-extrabold text-lg text-white disabled:opacity-40"
                style={{ background: "#18B5A0", boxShadow: "0 4px 0 #0E8A78" }}
              >
                {loading ? "Linking…" : success ? "Linked! ✓" : "Link Student →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
