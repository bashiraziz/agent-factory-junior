"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      if (err) { setError(err.message ?? "Sign-up failed"); return; }
      router.push("/onboarding");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FFFDF7" }}>
      <div className="w-full max-w-md space-y-6">

        <div className="flex flex-col items-center gap-3 text-center">
          <Mascot size={64} />
          <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
            Create your account
          </h1>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-sans text-xs font-extrabold uppercase tracking-widest"
            style={{ background: "#F0EBFF", color: "#7C5CFF" }}
          >
            👨‍👩‍👧 For parents &amp; teachers
          </div>
          <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
            Manage your child&apos;s or students&apos; AI learning — free to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-card p-8 space-y-4" style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}>
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
          <div className="space-y-2">
            <label className="font-sans text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#2A2A3C" }}>
              <span>👋</span> What should we call you?
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="Amelia M."
            />
          </div>
          <div className="space-y-2">
            <label className="font-sans text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#2A2A3C" }}>
              <span>📧</span> Your email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="font-sans text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#2A2A3C" }}>
              <span>🔐</span> Pick a secret password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="At least 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
          >
            {loading ? "Creating your account…" : "Create account →"}
          </button>
        </form>

        <p className="text-center font-sans" style={{ color: "#5C5747" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#7C5CFF" }} className="font-bold hover:underline">
            Sign in
          </Link>
        </p>

        <div
          className="rounded-xl px-4 py-3 font-sans text-sm text-center"
          style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#5C5747" }}
        >
          🎒 <strong>Student?</strong> Ask your parent or teacher to set up your account —
          you don&apos;t need to sign up yourself.{" "}
          <Link href="/join" className="font-bold hover:underline" style={{ color: "#7C5CFF" }}>
            Got a classroom code? Enter it here.
          </Link>
        </div>

      </div>
    </main>
  );
}
