"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [teacherConsented, setTeacherConsented] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        // Show consent checkbox only if this teacher hasn't consented yet
        if (data && !data.coppaConsentedAt) setNeedsConsent(true);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (needsConsent && !teacherConsented) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), coppaConsent: needsConsent ? teacherConsented : undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create classroom");
      }
      const classroom = await res.json();
      router.push(`/teacher/classrooms/${classroom.id}`);
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
        <Link
          href="/teacher/classrooms"
          className="p-2 rounded-block transition-colors"
          style={{ color: "#3DA5F4" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-display text-lg" style={{ color: "#2A2A3C" }}>New Classroom</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-card p-8"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🏫</div>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                Name Your Classroom
              </h1>
              <p className="font-sans mt-2" style={{ color: "#5C5747" }}>
                Students will see this name when they join.
              </p>
            </div>

            {error && (
              <div
                className="mb-4 p-3 rounded-block font-sans text-sm text-center"
                style={{ background: "#FFF1DC", color: "#E0792B" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block font-mono text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#8A8071" }}
                >
                  CLASSROOM NAME *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mrs. Johnson's Science Class"
                  maxLength={60}
                  required
                  className="w-full px-4 py-3 rounded-block font-sans text-base focus:outline-none"
                  style={{
                    background: "#FBF6EC",
                    border: "2px solid #F0E7D6",
                    color: "#2A2A3C",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#3DA5F4"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#F0E7D6"; }}
                />
              </div>

              <div
                className="rounded-block p-4"
                style={{ background: "#EFF7FF", border: "2px solid #3DA5F422" }}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#1F6FB0" }}>
                  WHAT HAPPENS NEXT
                </div>
                <ul className="font-sans text-sm space-y-1" style={{ color: "#2A2A3C" }}>
                  <li>✓ A unique join code is generated</li>
                  <li>✓ Share the code with your students</li>
                  <li>✓ Students join and build AI Workers</li>
                  <li>✓ You review their work and safety flags</li>
                </ul>
              </div>

              {needsConsent && (
                <label className="flex items-start gap-3 cursor-pointer" style={{ color: "#5C5747" }}>
                  <input
                    type="checkbox"
                    required
                    checked={teacherConsented}
                    onChange={(e) => setTeacherConsented(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-[#3DA5F4] flex-shrink-0"
                  />
                  <span className="font-sans text-sm leading-relaxed">
                    As a school official, I consent to Agent Factory Junior collecting student data
                    (usernames, block configurations, and AI run logs) solely for educational purposes
                    in my classroom, per the{" "}
                    <a href="/privacy" target="_blank" className="font-bold underline" style={{ color: "#3DA5F4" }}>
                      Privacy Policy
                    </a>. I confirm that parents have been informed of this use, or that my school&apos;s
                    acceptable-use policy covers educational technology tools.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={!name.trim() || loading || (needsConsent && !teacherConsented)}
                className="w-full py-3.5 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
                style={{ background: "#3DA5F4", boxShadow: "0 4px 0 #1F6FB0" }}
              >
                {loading ? "Creating…" : "Create Classroom →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
