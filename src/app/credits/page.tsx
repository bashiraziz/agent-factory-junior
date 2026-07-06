import Link from "next/link";
import { Mascot } from "@/components/mascot";

const CONTRIBUTORS = [
  {
    name: "Bashir Aziz",
    role: "Creator",
    note: "Built this so curious kids everywhere could meet AI as something they build and guide — not something that just happens to them.",
    emoji: "🧑‍💻",
    color: "#7C5CFF",
  },
  // Future contributors go here — same shape:
  // { name: "...", role: "Early Tester", note: "...", emoji: "🧪", color: "#3DA5F4" },
  // { name: "...", role: "Designer", note: "...", emoji: "🎨", color: "#FF7AB6" },
  // { name: "...", role: "Teacher Advisor", note: "...", emoji: "👩‍🏫", color: "#18B5A0" },
];

export default function CreditsPage() {
  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ background: "#FBF6EC" }}
    >
      <div className="w-full max-w-[600px] mx-auto space-y-6">

        {/* Back nav */}
        <Link
          href="/about"
          className="inline-flex items-center gap-2 font-sans font-bold text-sm"
          style={{ color: "#7C5CFF", textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to about
        </Link>

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Made with 💛
          </h1>
          <p className="font-sans text-base" style={{ color: "#5C5747", maxWidth: 420, margin: "0 auto" }}>
            Every line of code, every lesson, every block shape — built by real people
            who believe kids deserve to understand the tech that shapes their world.
          </p>
        </div>

        {/* Contributor cards */}
        {CONTRIBUTORS.map((c) => (
          <div
            key={c.name}
            className="rounded-2xl p-7"
            style={{
              background: "#FFFFFF",
              border: "2px solid #F0E7D6",
              boxShadow: "0 12px 32px rgba(58,46,28,.08)",
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${c.color}18`, border: `2px solid ${c.color}33` }}
              >
                {c.emoji}
              </div>
              <div>
                <div className="font-display text-xl font-semibold" style={{ color: "#2A2A3C" }}>
                  {c.name}
                </div>
                <div
                  className="font-mono text-xs uppercase tracking-widest font-bold"
                  style={{ color: c.color }}
                >
                  {c.role}
                </div>
              </div>
            </div>
            <p
              className="font-sans text-base leading-relaxed"
              style={{ color: "#5C5747" }}
            >
              {c.note}
            </p>
          </div>
        ))}

        {/* Open invitation card */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: "linear-gradient(180deg, #F4F0FF, #EDE6FF)",
            border: "2px dashed #7C5CFF55",
          }}
        >
          <div className="text-3xl mb-3">🌱</div>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color: "#2A2A3C" }}>
            This wall has room
          </h3>
          <p className="font-sans text-sm" style={{ color: "#5C5747", maxWidth: 360, margin: "0 auto" }}>
            If you helped shape Agent Factory Foundations — as a tester, teacher,
            translator, advisor, or friend — your name belongs here. Reach out.
          </p>
        </div>

        {/* Mascot sign-off */}
        <div className="flex flex-col items-center gap-2 pt-2 pb-4">
          <Mascot size={48} />
          <p className="font-sans text-sm font-bold" style={{ color: "#8A8071" }}>
            Thank you for building with us.
          </p>
        </div>

      </div>
    </main>
  );
}
