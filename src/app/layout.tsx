import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Factory Junior — Build Your First AI Worker",
  description: "A safe, child-friendly platform to build AI Workers with visual blocks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full" style={{ background: "#FFFDF7", fontFamily: "Nunito, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
