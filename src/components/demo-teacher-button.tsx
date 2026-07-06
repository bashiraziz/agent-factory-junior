"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

const DEMO_EMAIL = "demo-teacher@agentfactoryfoundations.com";
const DEMO_PASSWORD = "Demo1234!";

export function DemoTeacherButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signIn.email({ email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true });
      if (err) throw new Error(err.message ?? "Sign-in failed");
      await fetch("/api/demo-setup-teacher", { method: "POST" });
      router.push("/teacher/dashboard");
      router.refresh();
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "Failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        style={{ background: "#3DA5F4", boxShadow: "0 5px 0 #2E85D0" }}
      >
        {loading ? "Opening\u2026" : "Try as Demo Teacher \u2192"}
      </button>
      {error && (
        <p className="font-sans text-sm text-center" style={{ color: "#EF5A5A" }}>{error}</p>
      )}
    </div>
  );
}
