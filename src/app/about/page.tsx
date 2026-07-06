import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function AboutPage() {
  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ background: "#FBF6EC" }}
    >
      <div className="w-full max-w-[600px] mx-auto space-y-5">

        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-sans font-bold text-sm"
          style={{ color: "#7C5CFF", textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to home
        </Link>

        {/* Dedication card */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center gap-3"
          style={{
            background: "linear-gradient(180deg, #FFF6E4, #FFF1D6)",
            border: "2px solid #FFE3AE",
          }}
        >
          <span className="text-4xl">💛</span>
          <div
            className="font-mono text-[11px] uppercase tracking-widest font-bold"
            style={{ color: "#B07A20" }}
          >
            Dedication
          </div>
          <p className="font-sans text-base leading-relaxed" style={{ color: "#5C3D0A" }}>
            For my teachers at{" "}
            <strong>St. Lawrence&rsquo;s Boys School</strong>, Karachi, Pakistan.
            <br />
            Thank you for teaching me to stay curious. This one&rsquo;s for you.
          </p>
        </div>

        {/* Hero card */}
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center gap-5"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
        >
          <Mascot size={96} />

          <div>
            <h1 className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
              Agent Factory Foundations
            </h1>
            <p className="font-sans text-base font-semibold mt-1" style={{ color: "#7C5CFF" }}>
              Where kids build their first AI Workers
            </p>
          </div>

          <p
            className="font-sans text-base leading-relaxed"
            style={{ color: "#5C5747", maxWidth: 460 }}
          >
            I made this so that curious kids everywhere could meet AI as something they{" "}
            <em>build and guide</em> — not something that just happens to them. Every Worker
            here is created by a child, checked by a grown-up, and made with care.
          </p>
        </div>

        {/* Footer meta row */}
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-xs" style={{ color: "#A89E8C" }}>
            Version 1.0
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="font-sans font-bold text-sm"
              style={{ color: "#7C5CFF", textDecoration: "none" }}
            >
              Privacy
            </Link>
            <span style={{ color: "#D8CFBB" }}>·</span>
            <Link
              href="/credits"
              className="font-sans font-bold text-sm"
              style={{ color: "#7C5CFF", textDecoration: "none" }}
            >
              Credits
            </Link>
            <span style={{ color: "#D8CFBB" }}>·</span>
            <Link
              href="/help"
              className="font-sans font-bold text-sm"
              style={{ color: "#7C5CFF", textDecoration: "none" }}
            >
              Help
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
