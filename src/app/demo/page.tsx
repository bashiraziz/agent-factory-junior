"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/mascot";

export default function DemoPage() {
  useEffect(() => {
    // Full browser navigation — not Next.js router — so the request hits
    // /api/demo-login as a plain GET and the server can set cookies + redirect.
    window.location.href = "/api/demo-login";
  }, []);

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
      <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "#F0E7D6" }}>
        <div
          className="h-full rounded-full"
          style={{ background: "#7C5CFF", animation: "grow 12s ease-out forwards" }}
        />
      </div>
      <style>{`@keyframes grow { from { width: 0% } to { width: 90% } }`}</style>
    </main>
  );
}
