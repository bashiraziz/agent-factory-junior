"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const project = await res.json();
      router.push(`/student/projects/${project.id}/edit`);
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
          href="/student/projects"
          className="p-2 rounded-block hover:bg-paper-sunken transition-colors"
          style={{ color: "#7C5CFF" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div
          className="w-8 h-8 rounded-block flex items-center justify-center"
          style={{ background: "#7C5CFF" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="8" height="8" rx="2" fill="white" opacity="0.9" />
            <rect x="13" y="3" width="8" height="8" rx="2" fill="white" opacity="0.6" />
            <rect x="3" y="13" width="8" height="8" rx="2" fill="white" opacity="0.6" />
            <rect x="13" y="13" width="8" height="8" rx="2" fill="white" opacity="0.9" />
          </svg>
        </div>
        <span className="font-display text-lg" style={{ color: "#2A2A3C" }}>New AI Worker</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div
            className="rounded-card p-8"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">🤖</div>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                Name Your AI Worker
              </h1>
              <p className="font-sans mt-2" style={{ color: "#5C5747" }}>
                Give it a great name — you can always change it later.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block font-mono text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#8A8071" }}
                >
                  AI WORKER NAME *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Plant Science Tutor"
                  maxLength={60}
                  required
                  className="w-full px-4 py-3 rounded-block font-sans text-base focus:outline-none transition-colors"
                  style={{
                    background: "#FBF6EC",
                    border: "2px solid #F0E7D6",
                    color: "#2A2A3C",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#7C5CFF"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#F0E7D6"; }}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block font-mono text-xs uppercase tracking-widest mb-2"
                  style={{ color: "#8A8071" }}
                >
                  DESCRIPTION (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will this AI Worker help with?"
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-block font-sans text-base focus:outline-none transition-colors resize-none"
                  style={{
                    background: "#FBF6EC",
                    border: "2px solid #F0E7D6",
                    color: "#2A2A3C",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#7C5CFF"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#F0E7D6"; }}
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="w-full py-3.5 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
              >
                {loading ? "Creating…" : "Build It with Blocks →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
