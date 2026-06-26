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
          <p className="font-sans" style={{ color: "#5C5747" }}>Join Agent Factory Junior for free</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-card p-8 space-y-4" style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}>
          {error && (
            <div className="p-3 rounded-xl font-sans text-sm" style={{ background: "#FFF1DC", color: "#E0792B" }}>
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>Your name</label>
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
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>Email</label>
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
            <label className="font-mono text-xs uppercase tracking-widest" style={{ color: "#8A8071" }}>Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
              style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
              placeholder="Min. 8 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center font-sans" style={{ color: "#5C5747" }}>
          Already have an account?{" "}
          <Link href="/sign-in" style={{ color: "#7C5CFF" }} className="font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
