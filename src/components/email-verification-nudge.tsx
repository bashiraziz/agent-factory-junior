"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function EmailVerificationNudge({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: "/parent/dashboard" });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3 mb-6"
      style={{ background: "#FFF6E0", border: "2px solid #FFC53D", color: "#92400E" }}
    >
      <span className="text-2xl flex-shrink-0">📧</span>
      <div className="flex-1">
        <div className="font-sans font-extrabold text-sm">Verify your email to create child accounts</div>
        <div className="font-sans text-sm mt-0.5">
          Check your inbox for a verification link, or{" "}
          {sent ? (
            <span className="font-bold" style={{ color: "#2E9B52" }}>sent! check your inbox.</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={sending}
              className="font-bold underline disabled:opacity-50"
              style={{ color: "#7C5CFF" }}
            >
              {sending ? "sending…" : "resend it"}
            </button>
          )}.
        </div>
      </div>
    </div>
  );
}
