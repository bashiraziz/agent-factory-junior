import Link from "next/link";
import { PolicySections } from "./policy-content";

const KID_POINTS = [
  { icon: "🧩", text: "We only keep what you make — your blocks and runs." },
  { icon: "👨‍👩‍👧", text: "A grown-up (your parent or teacher) can see everything you do here." },
  { icon: "🚫", text: "We never sell your information to anyone, ever." },
  { icon: "🗑️", text: "Your grown-up can delete your account and everything in it, any time." },
];

export default function PrivacyPage() {
  return (
    <main
      className="min-h-screen px-6 py-12"
      style={{ background: "#FBF6EC" }}
    >
      <div className="w-full max-w-[720px] mx-auto space-y-8">

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

        {/* Page title */}
        <div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Privacy Policy
          </h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#8A8071" }}>
            Agent Factory Foundations · Last updated: 3 July 2026
          </p>
        </div>

        {/* Plain-language summary card */}
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: "#FFFFFF", border: "2px solid #7C5CFF33", boxShadow: "0 4px 0 #7C5CFF22" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <h2 className="font-display text-xl font-semibold" style={{ color: "#7C5CFF" }}>
              Your privacy, simply explained
            </h2>
          </div>
          <ul className="space-y-3">
            {KID_POINTS.map((p) => (
              <li key={p.icon} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                <span className="font-sans text-base font-semibold" style={{ color: "#2A2A3C" }}>
                  {p.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Full policy */}
        <PolicySections />

        {/* Legal callout */}
        <div
          className="rounded-2xl p-5 flex gap-4"
          style={{ background: "#FFFBEB", border: "2px solid #FCD34D" }}
        >
          <span className="text-2xl flex-shrink-0">⚖️</span>
          <div className="space-y-1">
            <p className="font-sans font-bold text-sm" style={{ color: "#92400E" }}>
              Not legal advice
            </p>
            <p className="font-sans text-sm leading-relaxed" style={{ color: "#78350F" }}>
              This policy describes how the app works in plain language, but it has not been reviewed
              by a lawyer. Before publishing to an app store or deploying to schools, have it reviewed
              by someone qualified in <strong>COPPA</strong> (US), <strong>GDPR-K</strong> (EU),
              and <strong>Pakistan&rsquo;s PDPB</strong> if applicable.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}
