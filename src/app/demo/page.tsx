import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { DemoParentButton } from "@/components/demo-parent-button";

export default function DemoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#FFFDF7" }}>
      <div className="w-full max-w-2xl space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3">
          <Mascot size={72} />
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Try Agent Factory Foundations
          </h1>
          <p className="font-sans text-lg" style={{ color: "#5C5747" }}>
            Pick a role and explore — no sign-up needed.
          </p>
        </div>

        {/* Two demo cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Parent card */}
          <div
            className="rounded-card p-7 flex flex-col gap-5"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="space-y-1">
              <div className="text-4xl">👨‍👩‍👧</div>
              <div className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>Parent view</div>
              <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
                See your student&apos;s AI workers, activity feed, replay proofs, and safety controls.
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3 font-mono text-xs space-y-1"
              style={{ background: "#F4F0FF", color: "#5B6BE6" }}
            >
              <div>Email &nbsp;&nbsp;demo@agentfactoryfoundations.com</div>
              <div>Password Demo1234!</div>
            </div>
            <DemoParentButton />
          </div>

          {/* Student card */}
          <div
            className="rounded-card p-7 flex flex-col gap-5"
            style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="space-y-1">
              <div className="text-4xl">🎒</div>
              <div className="font-display text-2xl font-semibold" style={{ color: "#2A2A3C" }}>Student view</div>
              <p className="font-sans text-sm" style={{ color: "#5C5747" }}>
                Log in as Alex, run AI workers, and see the student dashboard.
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3 font-mono text-xs space-y-1"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              <div>Username &nbsp;alex_demo</div>
              <div>PIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1234</div>
            </div>
            <Link
              href="/child/sign-in?demo=1"
              className="block w-full py-4 rounded-pill font-sans font-extrabold text-lg text-white text-center transition-transform hover:-translate-y-0.5"
              style={{ background: "#46C46A", boxShadow: "0 5px 0 #2E9B52" }}
            >
              Try as Demo Student →
            </Link>
          </div>
        </div>

        <p className="text-center font-sans text-sm" style={{ color: "#8A8071" }}>
          Demo data resets every 4 days.{" "}
          <Link href="/sign-in" className="hover:underline font-bold" style={{ color: "#7C5CFF" }}>
            Sign up free →
          </Link>
        </p>
      </div>
    </main>
  );
}
