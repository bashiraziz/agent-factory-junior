"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function ChildSignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";
  const [username, setUsername] = useState(isDemo ? "alex_demo" : "");
  const [pin, setPin] = useState(isDemo ? "1234" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pinRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/child/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again!");
        setPin("");
        pinRef.current?.focus();
        return;
      }
      router.push("/student/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFDF7" }}>
      <div className="w-full max-w-sm space-y-6">

        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={72} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
            Hey, welcome back!
          </h1>
          <p className="font-sans" style={{ color: "#5C5747" }}>
            Enter your username and secret PIN to jump back in.
          </p>
        </div>

        {isDemo && (
          <div
            className="rounded-xl px-4 py-3 text-center space-y-1"
            style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0" }}
          >
            <div className="font-sans font-extrabold text-sm" style={{ color: "#16A34A" }}>
              🎮 Demo student — fields pre-filled!
            </div>
            <div className="font-mono text-xs" style={{ color: "#5C5747" }}>
              username: alex_demo &nbsp;·&nbsp; PIN: 1234
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-card p-8 space-y-5"
          style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}
        >
          {error && (
            <div
              key={error}
              className="afj-shake p-3 rounded-xl font-sans text-sm flex items-start gap-2"
              style={{ background: "#FFF1DC", border: "2px solid #FFC53D66", color: "#8A5A00" }}
            >
              <span className="text-lg leading-none">😬</span>
              <div>
                <div className="font-extrabold">Hmm!</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="font-sans text-sm font-extrabold flex items-center gap-1.5"
              style={{ color: "#2A2A3C" }}
            >
              🙋 Your username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="coolbuilder42"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="pin"
              className="font-sans text-sm font-extrabold flex items-center gap-1.5"
              style={{ color: "#2A2A3C" }}
            >
              🔢 Your 4-digit PIN
            </label>
            <input
              id="pin"
              ref={pinRef}
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-3 rounded-[11px] font-mono text-2xl tracking-[0.5em] text-center outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading || pin.length !== 4 || !username.trim()}
            className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "#46C46A", boxShadow: "0 5px 0 #2E9B52" }}
          >
            {loading ? "Signing in…" : "Let's go! 🚀"}
          </button>
        </form>

        <div className="space-y-2 text-center">
          <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
            Got a classroom code?{" "}
            <Link href="/join" className="font-bold hover:underline" style={{ color: "#7C5CFF" }}>
              Enter it here
            </Link>
          </p>
          <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
            Forgot your PIN? Ask your parent or teacher to reset it for you.
          </p>
        </div>

      </div>
    </main>
  );
}
