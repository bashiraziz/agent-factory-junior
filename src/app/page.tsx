import Link from "next/link";
import { Mascot } from "@/components/mascot";
import {
  Blocks,
  ShieldCheck,
  ScrollText,
  Users,
} from "lucide-react";

const CHIPS = [
  { label: "Visual block editor", Icon: Blocks,      color: "#7C5CFF" },
  { label: "Safe for kids",        Icon: ShieldCheck, color: "#FF6B6B" },
  { label: "Reasoning receipts",   Icon: ScrollText,  color: "#FF924D" },
  { label: "Teacher & parent review", Icon: Users,   color: "#3DA5F4" },
];

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "#FFFDF7" }}
    >
      <div className="w-full max-w-[720px] flex flex-col items-center text-center gap-0">

        {/* Mascot */}
        <Mascot size={120} />

        {/* Logo lockup — tight gap below mascot */}
        <div className="flex items-center gap-3 mt-3">
          {/* Brand chip */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#7C5CFF",
            }}
          >
            <Blocks size={22} color="white" strokeWidth={2} />
          </div>

          {/* Wordmark */}
          <span
            className="font-display"
            style={{ fontSize: 40, fontWeight: 600, lineHeight: 1, color: "#2A2A3C", whiteSpace: "nowrap" }}
          >
            Agent Factory{" "}
            <span style={{ color: "#7C5CFF" }}>Junior</span>
          </span>
        </div>

        {/* H1 */}
        <h1
          className="font-display mt-10"
          style={{
            fontSize: "clamp(48px, 8vw, 64px)",
            fontWeight: 600,
            lineHeight: 1.05,
            color: "#2A2A3C",
          }}
        >
          Build your first{" "}
          <span style={{ color: "#7C5CFF" }}>AI Worker</span>
        </h1>

        {/* Subhead */}
        <p
          className="font-sans mt-5"
          style={{ fontSize: 22, fontWeight: 600, color: "#5C5747", maxWidth: 560, lineHeight: 1.4 }}
        >
          Snap together colorful blocks to create a safe, smart AI helper —
          then see exactly what it does, every time.
        </p>

        {/* Button pair */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center font-sans transition-transform hover:-translate-y-px active:translate-y-0"
            style={{
              padding: "16px 32px",
              borderRadius: 14,
              background: "#7C5CFF",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: 18,
              boxShadow: "0 5px 0 #5B43E0",
              textDecoration: "none",
            }}
          >
            Get started free
          </Link>

          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center font-sans transition-colors hover:bg-[#FBF6EC]"
            style={{
              padding: "16px 32px",
              borderRadius: 14,
              border: "2px solid #F0E7D6",
              color: "#2A2A3C",
              fontWeight: 700,
              fontSize: 18,
              textDecoration: "none",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#7C5CFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#F0E7D6";
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {CHIPS.map(({ label, Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 font-sans"
              style={{
                padding: "14px 18px",
                borderRadius: 13,
                background: "#FBF6EC",
                border: "2px solid #F0E7D6",
                fontWeight: 800,
                fontSize: 16,
                color: "#2A2A3C",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={18} color={color} strokeWidth={2} />
              {label}
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
