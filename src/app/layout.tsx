import type { Metadata } from "next";
import { Fredoka, Nunito, Space_Mono } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Factory Junior — Build Your First AI Worker",
  description: "A safe, child-friendly platform to build AI Workers with visual blocks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${fredoka.variable} ${nunito.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full"
        style={{ background: "#FFFDF7", fontFamily: "var(--font-nunito), sans-serif" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
