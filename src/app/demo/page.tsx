"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";
const TIMEOUT_MS    = 15_000;

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), TIMEOUT_MS);

    signIn
      .email({ email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true })
      .then(({ error: err }) => {
        clearTimeout(timer);
        if (err) {
          setError(err.message ?? "Demo login failed");
          return;
        }
        // Demo user is already a parent — skip onboarding
        router.push("/parent/dashboard");
        router.refresh();
      })
      .catch(() => {
        clearTimeout(timer);
        setError("Demo login failed — please try again.");
      });

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error || timedOut) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center"
        style={{ background: "#FFFDF7" }}
      >
        <Mascot size={80} />
        <div className="space-y-3">
          <p className="font-display text-xl font-semibold" style={{ color: "#2A2A3C" }}>
            {timedOut && !error ? "Taking longer than usual…" : "Hmm, something went wrong"}
          </p>
          <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
            {timedOut && !error
              ? "The server is waking up — try signing in manually below."
              : error}
          </p>
          <div className="flex flex-col items-center gap-2 pt-2">
            <a
              href="/sign-in"
              className="px-6 py-3 rounded-pill font-sans font-extrabold text-sm text-white"
              style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
            >
              Sign in manually →
            </a>
            <p className="font-sans text-xs" style={{ color: "#8A8071" }}>
              Email: {DEMO_EMAIL} · Password: {DEMO_PASSWORD}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "#FFFDF7" }}
    >
      <Mascot size={80} />
      <div className="text-center space-y-2">
        <p className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
          Loading your demo…
        </p>
        <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
          Waking up the server — usually takes 3–5 seconds.
        </p>
      </div>
      {/* Progress bar */}
      <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#F0E7D6" }}>
        <div
          className="h-full rounded-full"
          style={{
            background: "#7C5CFF",
            animation: "grow 12s ease-out forwards",
          }}
        />
      </div>
      <style>{`
        @keyframes grow { from { width: 0% } to { width: 90% } }
      `}</style>
    </main>
  );
}
