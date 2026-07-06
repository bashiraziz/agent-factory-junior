"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADJECTIVES = ["happy", "cosmic", "brave", "electric", "fuzzy", "swift", "mighty", "clever", "wild", "sunny"];
const NOUNS = ["robot", "panda", "comet", "dragon", "cactus", "penguin", "rocket", "falcon", "pixel", "turtle"];

function randomUsername() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${adj}-${noun}-${num}`;
}

export default function CreateChildAccountPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [created, setCreated] = useState<{ displayName: string; username: string; pin: string } | null>(null);
  const [suggestions] = useState(() => Array.from({ length: 3 }, randomUsername));

  const applySuggestion = useCallback((s: string) => setUsername(s), []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin !== pinConfirm) {
      setError("The two PINs don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/parent/students/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          pin,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setCreated({ displayName: displayName.trim(), username: username.trim().toLowerCase(), pin });
    } catch {
      setError("Could not connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#FFFDF7" }}>
        <header
          className="h-16 flex items-center px-6 gap-3"
          style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
        >
          <Link href="/parent/students" className="p-2 rounded-block" style={{ color: "#7C5CFF" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-lg" style={{ color: "#2A2A3C" }}>Account Created</span>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div
              className="rounded-card p-8 text-center"
              style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
            >
              <div className="afj-pop-in text-6xl mb-3">🎉</div>
              <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: "#2A2A3C" }}>
                {created.displayName}&apos;s account is ready!
              </h1>
              <p className="font-sans text-sm mb-6" style={{ color: "#5C5747" }}>
                Write these down and give them to your student. They&apos;ll use them to sign in at{" "}
                <span className="font-mono font-bold">/join</span>.
              </p>

              <div
                className="rounded-block p-5 mb-6 text-left space-y-3"
                style={{ background: "#F4F0FF", border: "2px solid #7C5CFF44" }}
              >
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#5B43E0" }}>
                    USERNAME
                  </div>
                  <div className="font-mono text-2xl font-bold" style={{ color: "#2A2A3C" }}>
                    {created.username}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#5B43E0" }}>
                    PIN
                  </div>
                  <div className="font-mono text-2xl font-bold tracking-widest" style={{ color: "#2A2A3C" }}>
                    {created.pin}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/parent/students"
                  className="w-full py-3 rounded-pill font-sans font-extrabold text-white"
                  style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
                >
                  Done
                </Link>
                <button
                  onClick={() => {
                    setCreated(null);
                    setDisplayName("");
                    setUsername("");
                    setPin("");
                    setPinConfirm("");
                    setConsented(false);
                  }}
                  className="w-full py-2 font-sans text-sm hover:underline"
                  style={{ color: "#8A8071" }}
                >
                  + Create another
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center px-6 gap-3"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <Link href="/parent/students" className="p-2 rounded-block" style={{ color: "#7C5CFF" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <span className="font-display text-lg" style={{ color: "#2A2A3C" }}>Create Student Account</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <div
            className="rounded-card p-8"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👶</div>
              <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
                No email needed
              </h1>
              <p className="font-sans mt-2" style={{ color: "#5C5747" }}>
                Pick a username and a 4-digit PIN for your student. They&apos;ll sign in at <span className="font-mono font-bold">/join</span>.
              </p>
            </div>

            {error && (
              <div
                key={error}
                className="afj-shake mb-4 p-3 rounded-xl font-sans text-sm flex items-start gap-2"
                style={{ background: "#FFF1DC", border: "2px solid #FFC53D66", color: "#8A5A00" }}
              >
                <span className="text-lg leading-none">😅</span>
                <div>
                  <div className="font-extrabold">Oops!</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-widest mb-1.5" style={{ color: "#8A8071" }}>
                  Nickname
                </label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. RocketPanda"
                  className="w-full px-4 py-3 rounded-[11px] font-sans text-base outline-none"
                  style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
                />
                <div className="font-sans text-xs mt-1" style={{ color: "#8A8071" }}>
                  Pick a fun nickname — not their real name.
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-widest mb-1.5" style={{ color: "#8A8071" }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="e.g. cool-coder-42"
                  className="w-full px-4 py-3 rounded-[11px] font-mono text-lg font-bold outline-none"
                  style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#7C5CFF" }}
                />
                <div className="font-sans text-xs mt-1 mb-2" style={{ color: "#8A8071" }}>
                  3–20 letters, numbers, - or _. This is what they type to sign in.
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className="px-3 py-1 rounded-pill font-mono text-xs font-bold transition-colors"
                      style={{ background: "#F4F0FF", color: "#7C5CFF", border: "1.5px solid #7C5CFF33" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest mb-1.5" style={{ color: "#8A8071" }}>
                    4-digit PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-[11px] font-mono text-2xl font-bold text-center tracking-widest outline-none"
                    style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest mb-1.5" style={{ color: "#8A8071" }}>
                    Confirm PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    required
                    maxLength={4}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="••••"
                    className="w-full px-4 py-3 rounded-[11px] font-mono text-2xl font-bold text-center tracking-widest outline-none"
                    style={{ background: "#FBF6EC", border: "1.5px solid #F0E7D6", color: "#2A2A3C" }}
                  />
                </div>
              </div>

              <div
                className="rounded-block p-4"
                style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
              >
                <div className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: "#5B43E0" }}>
                  KEEP IT SAFE
                </div>
                <p className="font-sans text-xs" style={{ color: "#2A2A3C" }}>
                  Write the username and PIN somewhere safe. You&apos;ll need them if your student forgets. You can also delete the account any time.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer" style={{ color: "#5C5747" }}>
                <input
                  type="checkbox"
                  required
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#7C5CFF] flex-shrink-0"
                />
                <span className="font-sans text-sm leading-relaxed">
                  I am this student&apos;s parent or legal guardian. I have read the{" "}
                  <a href="/privacy" target="_blank" className="font-bold underline" style={{ color: "#7C5CFF" }}>
                    Privacy Policy
                  </a>{" "}
                  and I consent to my student&apos;s use of Agent Factory Foundations, including AI processing of
                  their block configurations by Google Gemini. I understand I can delete my student&apos;s
                  account and all associated data at any time.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !consented}
                className="w-full py-3.5 rounded-pill font-sans font-extrabold text-lg text-white disabled:opacity-60"
                style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
              >
                {loading ? "Creating…" : "Create account 🎉"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
