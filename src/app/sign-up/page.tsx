"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";

type Step = "age-gate" | "form" | "under-13";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("age-gate");
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
          {step === "age-gate" && (
            <>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                Quick check first
              </h1>
              <p className="font-sans" style={{ color: "#5C5747" }}>
                Are you 13 or older?
              </p>
            </>
          )}
          {step === "form" && (
            <>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                Create your account
              </h1>
              <p className="font-sans" style={{ color: "#5C5747" }}>Join Agent Factory Junior for free</p>
            </>
          )}
          {step === "under-13" && (
            <>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                No problem!
              </h1>
              <p className="font-sans" style={{ color: "#5C5747" }}>
                Here&apos;s how you can get started.
              </p>
            </>
          )}
        </div>

        {step === "age-gate" && (
          <div className="rounded-card p-8 space-y-4" style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}>
            <button
              onClick={() => setStep("form")}
              className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5"
              style={{ background: "#7C5CFF", boxShadow: "0 5px 0 #5B43E0" }}
            >
              Yes, I&apos;m 13 or older
            </button>
            <button
              onClick={() => setStep("under-13")}
              className="w-full py-4 rounded-pill font-sans font-extrabold text-lg transition-transform hover:-translate-y-0.5"
              style={{ background: "#FBF6EC", border: "2px solid #F0E7D6", color: "#2A2A3C" }}
            >
              No, I&apos;m under 13
            </button>
          </div>
        )}

        {step === "under-13" && (
          <div className="rounded-card p-8 space-y-4" style={{ background: "#FFFFFF", boxShadow: "0 18px 50px rgba(58,46,28,.12)", border: "2px solid #F0E7D6" }}>
            <Link
              href="/join"
              className="flex items-start gap-4 p-4 rounded-xl transition-colors hover:opacity-80"
              style={{ background: "#F0EBFF", border: "2px solid #D4C8FF" }}
            >
              <span className="text-2xl">🏫</span>
              <div>
                <div className="font-sans font-extrabold" style={{ color: "#2A2A3C" }}>Got a classroom code?</div>
                <div className="font-sans text-sm mt-0.5" style={{ color: "#5C5747" }}>
                  Enter the code your teacher gave you — no account needed.
                </div>
              </div>
            </Link>
            <div
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{ background: "#FBF6EC", border: "2px solid #F0E7D6" }}
            >
              <span className="text-2xl">👨‍👩‍👧</span>
              <div>
                <div className="font-sans font-extrabold" style={{ color: "#2A2A3C" }}>Ask a parent</div>
                <div className="font-sans text-sm mt-0.5" style={{ color: "#5C5747" }}>
                  A parent can create an account and add you as a child.
                </div>
                <Link
                  href="/sign-up/parent"
                  className="inline-block mt-2 font-sans font-bold text-sm hover:underline"
                  style={{ color: "#7C5CFF" }}
                >
                  Go to parent sign-up →
                </Link>
              </div>
            </div>
            <button
              onClick={() => setStep("age-gate")}
              className="w-full text-center font-sans text-sm hover:underline"
              style={{ color: "#8A8071" }}
            >
              ← Back
            </button>
          </div>
        )}

        {step === "form" && (
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
            <button
              type="button"
              onClick={() => setStep("age-gate")}
              className="w-full text-center font-sans text-sm hover:underline"
              style={{ color: "#8A8071" }}
            >
              ← Back
            </button>
          </form>
        )}

        {step !== "under-13" && (
          <p className="text-center font-sans" style={{ color: "#5C5747" }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "#7C5CFF" }} className="font-bold hover:underline">
              Sign in
            </Link>
          </p>
        )}

      </div>
    </main>
  );
}
