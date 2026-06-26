import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#FFFDF7" }}>
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo + mascot */}
        <div className="flex flex-col items-center gap-4">
          <Mascot size={96} />
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#7C5CFF" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="6" height="10" rx="2" />
                <rect x="9" y="3" width="6" height="14" rx="2" />
                <rect x="16" y="7" width="6" height="10" rx="2" />
              </svg>
            </div>
            <span className="font-display text-3xl font-semibold" style={{ color: "#2A2A3C" }}>
              Agent Factory <span style={{ color: "#7C5CFF" }}>Junior</span>
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="font-display text-4xl font-semibold leading-tight" style={{ color: "#2A2A3C" }}>
            Build your first AI Worker
          </h1>
          <p className="text-lg font-sans" style={{ color: "#5C5747" }}>
            Snap together colorful blocks to create a safe, smart AI helper —
            then see exactly what it does, every time.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center px-8 py-4 rounded-pill font-sans font-extrabold text-lg text-white transition-transform hover:-translate-y-0.5"
            style={{
              background: "#7C5CFF",
              boxShadow: "0 5px 0 #5B43E0",
            }}
          >
            Get started free
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center px-8 py-4 rounded-pill font-sans font-bold text-lg border-2 transition-colors hover:bg-paper-sunken"
            style={{ borderColor: "#F0E7D6", color: "#5C5747" }}
          >
            Sign in
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {[
            { emoji: "🎨", label: "Visual block editor" },
            { emoji: "🔒", label: "Safe for kids" },
            { emoji: "🧾", label: "Reasoning receipts" },
            { emoji: "👩‍🏫", label: "Teacher & parent review" },
          ].map(({ emoji, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-pill font-sans font-semibold text-sm"
              style={{ background: "#FBF6EC", color: "#5C5747", border: "1.5px solid #F0E7D6" }}
            >
              <span>{emoji}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
