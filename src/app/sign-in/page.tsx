"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signIn.email({
        email: form.email,
        password: form.password,
        rememberMe: true,
      });
      if (err) { setError(err.message ?? "Sign-in failed"); return; }
      router.push("/onboarding");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Sign-in failed");
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
            Welcome back!
          </h1>
          <p className="font-sans" style={{ color: "#5C5747" }}>Sign in to your Agent Factory account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-card p-8 space-y-4" style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}>
          {error && (
            <div className="p-3 rounded-xl font-sans text-sm" style={{ background: "#FFF1DC", color: "#E0792B" }}>
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none focus:ring-2"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none focus:ring-2"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center font-sans" style={{ color: "#5C5747" }}>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" style={{ color: "#7C5CFF" }} className="font-bold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </main>
  );
}
