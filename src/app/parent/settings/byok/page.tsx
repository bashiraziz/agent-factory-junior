import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, providerKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BYOKEntryCard } from "@/components/byok-entry-card";

export default async function ParentBYOKPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "parent") redirect(`/${profile.role}/dashboard`);

  const [pk] = await db.select().from(providerKeys).where(eq(providerKeys.ownerProfileId, profile.id));

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center gap-3 px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <Link href="/parent/dashboard" style={{ color: "#18B5A0" }} className="p-2 rounded-block">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-block flex items-center justify-center text-lg" style={{ background: "#7C5CFF" }}>🔑</div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>AI Key Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            FAMILY SETTINGS
          </div>
          <h1 className="font-display text-3xl" style={{ color: "#2A2A3C" }}>Your AI Key</h1>
          <p className="font-sans mt-2" style={{ color: "#5C5747" }}>
            Connect your own free Google AI key to unlock higher daily limits for all your kids — same safety rules, no payment info ever.
          </p>
        </div>

        <BYOKEntryCard
          connected={!!pk}
          keyTail={pk?.keyTail ?? null}
          status={pk?.status ?? null}
        />

        <div
          className="rounded-card p-5 flex items-start gap-4"
          style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
        >
          <div className="text-2xl flex-shrink-0">🛡</div>
          <div>
            <div className="font-sans font-extrabold text-sm" style={{ color: "#2A2A3C" }}>
              Your key stays private
            </div>
            <div className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
              We store it encrypted with AES-256. It's never shown in full — only the last 4 characters — and your kids can't see it.
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-2">
          <Link
            href="/about"
            className="font-sans font-bold text-sm"
            style={{ color: "#8A8071", textDecoration: "none" }}
          >
            About Agent Factory Foundations
          </Link>
        </div>
      </main>
    </div>
  );
}
