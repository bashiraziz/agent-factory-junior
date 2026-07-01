"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export interface HelpTip {
  icon: string;
  title: string;
  body: string;
}

interface HelpButtonProps {
  screenKey: string;
  title: string;
  tips: HelpTip[];
  autoOpenFirstVisit?: boolean;
}

export function HelpButton({ screenKey, title, tips, autoOpenFirstVisit = true }: HelpButtonProps) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const key = `afj-help-seen:${screenKey}`;
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(key);
    if (!seen) {
      if (autoOpenFirstVisit) {
        setOpen(true);
        localStorage.setItem(key, "1");
      } else {
        setPulse(true); // draw attention if we're not auto-opening
      }
    }
  }, [screenKey, autoOpenFirstVisit]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => { setOpen(true); setPulse(false); }}
        aria-label="Hint"
        title="Need a hint?"
        className={`relative flex flex-col items-center justify-center gap-0 transition-transform hover:-translate-y-0.5 ${pulse ? "afj-hint-pulse" : ""}`}
        style={{ width: 44, height: 44 }}
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
          style={{
            background: "#FFF6E6",
            border: "2px solid #FFC53D66",
            boxShadow: "0 3px 0 #FFC53D33",
          }}
        >
          💡
        </span>
        <span
          className="font-sans font-extrabold text-[9px] mt-0.5 uppercase tracking-wider"
          style={{ color: "#E0792B" }}
        >
          Hint
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop — semi-transparent, click to close */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(42,42,60,0.25)" }}
          />

          {/* Slide-out panel */}
          <aside
            role="dialog"
            aria-label={`${title} help`}
            className="fixed top-0 right-0 h-screen z-50 flex flex-col afj-slide-in"
            style={{
              width: "360px",
              background: "#FFFFFF",
              borderLeft: "2px solid #F0E7D6",
              boxShadow: "-24px 0 60px rgba(58,46,28,.18)",
            }}
          >
            <header
              className="flex-shrink-0 flex items-center justify-between px-5 py-4"
              style={{ background: "#F4F0FF", borderBottom: "2px solid #E8E0FF" }}
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#7C5CFF" }}>
                  QUICK HELP
                </div>
                <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
                  {title}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close help"
                className="w-8 h-8 rounded-full flex items-center justify-center font-sans font-extrabold"
                style={{ background: "#FFFFFF", color: "#5C5747", border: "2px solid #E8E0FF" }}
              >
                ×
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className="rounded-block p-3 flex gap-3"
                  style={{ background: "#FBF6EC", border: "2px solid #F0E7D6" }}
                >
                  <div
                    className="w-9 h-9 rounded-block flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: "#FFFFFF" }}
                  >
                    {tip.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
                      {tip.title}
                    </div>
                    <div className="font-sans text-xs mt-1 leading-relaxed" style={{ color: "#5C5747" }}>
                      {tip.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer
              className="flex-shrink-0 p-4 flex items-center justify-between gap-2"
              style={{ background: "#FBF6EC", borderTop: "2px solid #F0E7D6" }}
            >
              <Link
                href="/help"
                className="font-sans font-extrabold text-xs"
                style={{ color: "#7C5CFF" }}
                onClick={() => setOpen(false)}
              >
                See full help →
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-pill font-sans font-extrabold text-xs text-white"
                style={{ background: "#7C5CFF", boxShadow: "0 3px 0 #5B43E0" }}
              >
                Got it
              </button>
            </footer>
          </aside>
        </>
      )}
    </>
  );
}
