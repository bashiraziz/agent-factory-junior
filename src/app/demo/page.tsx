"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Mascot } from "@/components/mascot";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    signIn
      .email({ email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true })
      .then(({ error: err }) => {
        if (err) { setError(err.message ?? "Demo login failed"); return; }
        router.push("/onboarding");
        router.refresh();
      })
      .catch(() => setError("Demo login failed — please try again."));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center gap-6 px-4"
      style={{ background: "#FFFDF7" }}
    >
      <Mascot size={80} />
      {error ? (
        <div className="text-center space-y-3">
          <p className="font-sans font-extrabold text-lg" style={{ color: "#C0443A" }}>
            😬 {error}
          </p>
          <a
            href="/sign-in"
            className="font-sans text-sm font-bold hover:underline"
            style={{ color: "#7C5CFF" }}
          >
            Go to sign-in →
          </a>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
            Loading your demo…
          </p>
          <p className="font-sans text-sm" style={{ color: "#8A8071" }}>
            Just a moment!
          </p>
        </div>
      )}
    </main>
  );
}
