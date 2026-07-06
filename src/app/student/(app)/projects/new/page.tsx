"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STARTER_TEMPLATES } from "@/lib/templates/starter-templates";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createFromTemplate = async (templateId: string) => {
    setLoading(templateId);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const project = await res.json();
      router.push(`/student/projects/${project.id}/edit`);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Something went wrong");
      setLoading(null);
    }
  };

  const createBlank = async () => {
    setLoading("blank");
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My AI Worker" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const project = await res.json();
      router.push(`/student/projects/${project.id}/edit`);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center px-6 gap-3"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <Link
          href="/student/dashboard"
          className="p-2 rounded-block transition-colors"
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

      <main className="flex-1 px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="text-5xl mb-3">🤖</div>
            <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
              Pick a starting point
            </h1>
            <p className="font-sans text-lg mt-2" style={{ color: "#5C5747" }}>
              Start from a ready-made worker, or build one from scratch.
            </p>
          </div>

          {error && (
            <div
              className="mb-6 p-3 rounded-block font-sans text-sm text-center max-w-md mx-auto"
              style={{ background: "#FFF1DC", color: "#E0792B" }}
            >
              {error}
            </div>
          )}

          {/* Template cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {STARTER_TEMPLATES.map((tpl) => {
              const isLoading = loading === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => createFromTemplate(tpl.id)}
                  disabled={loading !== null}
                  className="rounded-card p-5 text-left flex gap-4 transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "#FFFFFF",
                    border: `2px solid ${tpl.color}33`,
                    boxShadow: `0 4px 0 ${tpl.color}44, 0 18px 40px rgba(58,46,28,.08)`,
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-block flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: `${tpl.color}22` }}
                  >
                    {tpl.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-semibold" style={{ color: "#2A2A3C" }}>
                      {tpl.name}
                    </div>
                    <div className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
                      {tpl.tagline}
                    </div>
                    <div
                      className="font-mono text-[10px] uppercase tracking-widest mt-3"
                      style={{ color: tpl.color }}
                    >
                      {isLoading ? "CREATING…" : `USE THIS TEMPLATE →`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Start blank */}
          <div
            className="rounded-card p-5 flex items-center gap-4"
            style={{ background: "#FBF6EC", border: "2px dashed #F0E7D6" }}
          >
            <div
              className="w-12 h-12 rounded-block flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: "#FFFFFF", color: "#8A8071" }}
            >
              +
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
                Start blank
              </div>
              <div className="font-sans text-sm" style={{ color: "#5C5747" }}>
                Build your own worker from scratch with blocks.
              </div>
            </div>
            <button
              onClick={createBlank}
              disabled={loading !== null}
              className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-sm text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              {loading === "blank" ? "Creating…" : "Start blank →"}
            </button>
          </div>

          <p className="font-sans text-xs text-center mt-6" style={{ color: "#8A8071" }}>
            You can rename any worker later from the editor.
          </p>
        </div>
      </main>
    </div>
  );
}
