import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="font-sans text-sm mt-1" style={{ color: "#8A8071" }}>
            Agent Factory Foundations · Last updated: 3 July 2026
          </p>
        </div>

        {/* Stub card */}
        <div
          className="rounded-2xl p-8 text-center space-y-4"
          style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
        >
          <div className="text-5xl">📋</div>
          <h2 className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>
            Full terms coming soon
          </h2>
          <p className="font-sans text-base" style={{ color: "#5C5747", maxWidth: 480, margin: "0 auto" }}>
            We&rsquo;re working on a full set of terms of service. In the meantime, if you have
            any questions about using Agent Factory Foundations, please reach out to us directly.
          </p>
          <a
            href="mailto:bashiraziz@yahoo.com"
            className="inline-block font-sans font-bold text-sm"
            style={{ color: "#7C5CFF" }}
          >
            bashiraziz@yahoo.com
          </a>
        </div>

        {/* Legal callout */}
        <div
          className="rounded-2xl p-5 flex gap-4"
          style={{ background: "#FFFBEB", border: "2px solid #FCD34D" }}
        >
          <span className="text-2xl flex-shrink-0">⚖️</span>
          <p className="font-sans text-sm leading-relaxed" style={{ color: "#78350F" }}>
            By using Agent Factory Foundations you agree to use the platform responsibly and in
            accordance with our{" "}
            <Link href="/privacy" style={{ color: "#7C5CFF", fontWeight: 700 }}>
              Privacy Policy
            </Link>
            . Full terms will be published here before any commercial launch.
          </p>
        </div>

      </div>
    </main>
  );
}
