"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascot";

type Mode = "classroom" | "pin";
type Step = "code" | "nickname";

export default function JoinPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("classroom");

  // Classroom flow
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");

  // PIN flow
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

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

  const handlePinSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/student/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), pin }),
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

  const heading =
    mode === "pin"
      ? "Welcome back!"
      : step === "code"
        ? "Enter your classroom code"
        : "What should we call you?";
  const sub =
    mode === "pin"
      ? "Type your username and PIN to sign in."
      : step === "code"
        ? "Your teacher gave you a code — type it below."
        : "Pick a nickname for your session. You can skip this.";

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#FFFDF7" }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={72} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
            {heading}
          </h1>
          <p className="font-sans" style={{ color: "#5C5747" }}>{sub}</p>
        </div>

        <div
          className="rounded-card p-3"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 8px 24px rgba(58,46,28,.08)" }}
        >
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setMode("classroom"); setError(null); }}
              className="py-2.5 rounded-pill font-sans font-extrabold text-sm transition-transform"
              style={{
                background: mode === "classroom" ? "#7C5CFF" : "#F4F0FF",
                color: mode === "classroom" ? "#FFFFFF" : "#5B43E0",
                boxShadow: mode === "classroom" ? "0 3px 0 #5B43E0" : "none",
              }}
            >
              🏫 Classroom code
            </button>
            <button
              type="button"
              onClick={() => { setMode("pin"); setError(null); }}
              className="py-2.5 rounded-pill font-sans font-extrabold text-sm transition-transform"
              style={{
                background: mode === "pin" ? "#7C5CFF" : "#F4F0FF",
                color: mode === "pin" ? "#FFFFFF" : "#5B43E0",
                boxShadow: mode === "pin" ? "0 3px 0 #5B43E0" : "none",
              }}
            >
              🔐 Username & PIN
            </button>
          </div>
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
              key={error}
              className="afj-shake p-3 rounded-xl font-sans text-sm flex items-start gap-2"
              style={{ background: "#FFF1DC", border: "2px solid #FFC53D66", color: "#8A5A00" }}
            >
              <span className="text-lg leading-none">😅</span>
              <div>
                <div className="font-extrabold">Oops!</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          {mode === "classroom" && step === "code" && (
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

          {mode === "classroom" && step === "nickname" && (
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

          {mode === "pin" && (
            <form onSubmit={handlePinSignIn} className="space-y-4">
              <div className="space-y-2">
                <label
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "#8A8071" }}
                >
                  Your username
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="amina2018"
                  className="w-full px-4 py-3 rounded-[11px] font-mono text-lg font-bold outline-none"
                  style={{
                    background: "#FBF6EC",
                    border: "1.5px solid #F0E7D6",
                    color: "#7C5CFF",
                  }}
                />
              </div>
              <div className="space-y-2">
                <label
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "#8A8071" }}
                >
                  4-digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-4 py-4 rounded-[11px] font-mono text-3xl font-bold text-center tracking-[0.4em] outline-none"
                  style={{
                    background: "#FBF6EC",
                    border: "1.5px solid #F0E7D6",
                    color: "#2A2A3C",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || pin.length !== 4 || !username}
                className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: "#46C46A", boxShadow: "0 5px 0 #2E9B52" }}
              >
                {loading ? "Signing in…" : "Let's go 🎉"}
              </button>
              <p className="text-center font-sans text-xs" style={{ color: "#8A8071" }}>
                Forgot your PIN? Ask your grown-up to reset it.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
