import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, parentChildLinks, agentRuns } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";

export default async function ParentChildrenPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "parent") redirect(`/${profile.role}/dashboard`);

  const links = await db
    .select()
    .from(parentChildLinks)
    .where(eq(parentChildLinks.parentId, profile.id));

  const children = await Promise.all(
    links.map(async (link) => {
      const [child] = await db.select().from(profiles).where(eq(profiles.id, link.studentId));
      const runs = await db
        .select()
        .from(agentRuns)
        .where(eq(agentRuns.studentId, link.studentId))
        .orderBy(desc(agentRuns.createdAt))
        .limit(20);
      return { child: child || null, runs, linkCode: link.linkCode };
    })
  );

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/parent/dashboard" style={{ color: "#18B5A0" }} className="p-2 rounded-block">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>My Children</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/parent/children/create"
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
          >
            + Create Account
          </Link>
          <Link
            href="/parent/children/link"
            className="px-4 py-2 rounded-pill font-sans font-extrabold text-sm text-white"
            style={{ background: "#18B5A0", boxShadow: "0 4px 0 #0E8A78" }}
          >
            + Link a Child
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            LINKED CHILDREN
          </div>
          <h1 className="font-display text-3xl" style={{ color: "#2A2A3C" }}>
            {children.length} child{children.length !== 1 ? "ren" : ""} linked
          </h1>
        </div>

        {children.length === 0 ? (
          <div
            className="rounded-card p-12 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6" }}
          >
            <div className="text-6xl mb-4">👨‍👩‍👧</div>
            <div className="font-display text-2xl mb-2" style={{ color: "#2A2A3C" }}>
              No children linked yet
            </div>
            <p className="font-sans mb-6" style={{ color: "#5C5747" }}>
              Create an account for your child (no email needed!) or link an existing one.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/parent/children/create"
                className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
                style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
              >
                Create Account →
              </Link>
              <Link
                href="/parent/children/link"
                className="inline-block px-6 py-3 rounded-pill font-sans font-extrabold text-white"
                style={{ background: "#18B5A0", boxShadow: "0 4px 0 #0E8A78" }}
              >
                Link a Child →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(({ child, runs, linkCode }) => {
              if (!child) return null;
              const safeRuns = runs.filter((r) => r.status === "completed").length;
              return (
                <Link
                  key={child.id}
                  href={`/parent/children/${child.id}`}
                  className="flex items-center gap-4 rounded-card p-5 transition-transform hover:-translate-y-0.5"
                  style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 4px 12px rgba(58,46,28,.08)" }}
                >
                  <AvatarChip name={child.displayName} size={50} />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
                      {child.displayName}
                    </div>
                    <div className="font-sans text-sm" style={{ color: "#5C5747" }}>
                      {runs.length} runs · Link code: <span className="font-mono font-bold">{linkCode}</span>
                    </div>
                    <div
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-pill font-mono text-[10px] font-bold"
                      style={{ background: "#D1FAE5", color: "#2E9B52" }}
                    >
                      ● {safeRuns} SAFE RUNS
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8071" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
