"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascot";

type Step = "code" | "nickname";

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setCode(trimmed);
    setStep("nickname");
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nickname: nickname.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push("/student/dashboard");
    } catch {
      setError("Could not connect — check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFDF7" }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={72} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
            {step === "code" ? "Enter your classroom code" : "What should we call you?"}
          </h1>
          <p className="font-sans" style={{ color: "#5C5747" }}>
            {step === "code"
              ? "Your teacher gave you a code — type it below."
              : "Pick a nickname for your session. You can skip this."}
          </p>
        </div>

        <div
          className="rounded-card p-8 space-y-4"
          style={{
            background: "#FFFFFF",
            boxShadow: "0 18px 50px rgba(58,46,28,.12)",
            border: "2px solid #F0E7D6",
          }}
        >
          {error && (
            <div
              className="p-3 rounded-xl font-sans text-sm text-center"
              style={{ background: "#FFF1DC", color: "#E0792B" }}
            >
              {error}
            </div>
          )}

          {step === "code" && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "#8A8071" }}
                >
                  Classroom code
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MOON-42"
                  className="w-full px-4 py-4 rounded-[11px] font-mono text-2xl text-center font-bold tracking-widest outline-none uppercase"
                  style={{
                    background: "#FBF6EC",
                    border: "1.5px solid #F0E7D6",
                    color: "#7C5CFF",
                  }}
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5"
                style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
              >
                Next →
              </button>
            </form>
          )}

          {step === "nickname" && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-mono text-lg font-bold tracking-widest"
                style={{ background: "#F4F0FF", color: "#7C5CFF" }}
              >
                {code}
              </div>
              <div className="space-y-2">
                <label
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "#8A8071" }}
                >
                  Nickname (optional)
                </label>
                <input
                  type="text"
                  autoFocus
                  maxLength={30}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Explorer, Star, Comet…"
                  className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
                  style={{
                    background: "#FBF6EC",
                    border: "1.5px solid #F0E7D6",
                    color: "#2A2A3C",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: "#46C46A", boxShadow: "0 5px 0 #2E9B52" }}
              >
                {loading ? "Joining…" : "Join classroom 🎉"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("code"); setError(null); }}
                className="w-full text-center font-sans text-sm hover:underline"
                style={{ color: "#8A8071" }}
              >
                ← Different code
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
