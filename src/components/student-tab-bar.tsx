"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/student/dashboard", icon: "🏠", label: "Home", match: (p: string) => p === "/student/dashboard" },
  { href: "/student/projects", icon: "🤖", label: "Workers", match: (p: string) => p.startsWith("/student/projects") },
  { href: "/help", icon: "💡", label: "Help", match: (p: string) => p.startsWith("/help") },
];

const HIDE_ON_PREFIXES = [
  "/student/projects/",
];
const HIDE_ON_SUFFIXES = ["/run", "/edit"];

function shouldHide(pathname: string): boolean {
  if (!HIDE_ON_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return HIDE_ON_SUFFIXES.some((s) => pathname.endsWith(s));
}

export function StudentTabBar() {
  const pathname = usePathname() || "";
  if (shouldHide(pathname)) return null;

  return (
    <>
      {/* Spacer so page content doesn't hide behind the bar */}
      <div aria-hidden style={{ height: 84 }} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: "#FFFFFF",
          borderTop: "2px solid #F0E7D6",
          boxShadow: "0 -6px 24px rgba(58,46,28,.10)",
        }}
        aria-label="Main navigation"
      >
        <div className="max-w-md mx-auto flex items-stretch justify-around px-2 py-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-transform hover:-translate-y-0.5"
                style={{
                  background: active ? "#F4F0FF" : "transparent",
                  color: active ? "#7C5CFF" : "#8A8071",
                }}
              >
                <span
                  className={active ? "text-2xl afj-pop-in" : "text-2xl"}
                  style={{ lineHeight: 1 }}
                >
                  {tab.icon}
                </span>
                <span
                  className="font-sans text-[11px] font-extrabold"
                  style={{ letterSpacing: 0.2 }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
