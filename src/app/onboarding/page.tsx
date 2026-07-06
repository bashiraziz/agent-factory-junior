"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

const ROLES = [
  {
    id: "teacher",
    label: "I'm a Teacher",
    desc: "Create classrooms and review student work.",
    emoji: "👩‍🏫",
    color: "#3DA5F4",
  },
  {
    id: "parent",
    label: "I'm a Parent",
    desc: "Stay connected to your student's learning.",
    emoji: "👨‍👩‍👧",
    color: "#18B5A0",
  },
  {
    id: "admin",
    label: "I'm an Admin",
    desc: "Manage the platform and all users.",
    emoji: "⚙️",
    color: "#5B6BE6",
  },
];

export default function OnboardingPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleContinue = async () => {
    if (!selected) return;
    if (!session?.user) {
      setError("Session not found — try refreshing the page.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selected,
          displayName: session.user.name || session.user.email,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/${selected}/dashboard`);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFDF7" }}>
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
            Who are you?
          </h1>
          <p className="font-sans" style={{ color: "#5C5747" }}>
            Pick your role to get the right dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl font-sans text-sm text-center" style={{ background: "#FFF1DC", color: "#E0792B" }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role.id)}
              className="p-6 rounded-card text-left transition-all hover:-translate-y-0.5"
              style={{
                background: selected === role.id ? role.color : "#FFFFFF",
                border: selected === role.id ? `3px solid ${role.color}` : "2px solid #F0E7D6",
                boxShadow: selected === role.id ? `0 8px 0 rgba(0,0,0,.1)` : "0 4px 12px rgba(58,46,28,.08)",
                color: selected === role.id ? "#FFFFFF" : "#2A2A3C",
              }}
            >
              <div className="text-3xl mb-3">{role.emoji}</div>
              <div className="font-display text-xl font-semibold mb-1">{role.label}</div>
              <div className="font-sans text-sm" style={{ color: selected === role.id ? "rgba(255,255,255,.85)" : "#5C5747" }}>
                {role.desc}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!selected || loading || sessionLoading}
          className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40"
          style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
        >
          {sessionLoading ? "Loading…" : loading ? "Setting up…" : "Continue →"}
        </button>

        <div
          className="rounded-xl px-4 py-3 font-sans text-sm text-center"
          style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", color: "#5C5747" }}
        >
          🎒 <strong>Are you a student?</strong>{" "}
          <Link href="/student/sign-in" className="font-bold hover:underline" style={{ color: "#16A34A" }}>
            Sign in with your username &amp; PIN →
          </Link>
        </div>
      </div>
    </main>
  );
}
