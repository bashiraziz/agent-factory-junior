import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles, parentChildLinks, agentRuns, providerKeys } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AvatarChip } from "@/components/avatar-chip";
import { StatusPill } from "@/components/status-pill";
import { BYOKEntryCard } from "@/components/byok-entry-card";
import { EmailVerificationNudge } from "@/components/email-verification-nudge";

export default async function ParentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) redirect("/onboarding");
  if (profile.role !== "parent") redirect(`/${profile.role}/dashboard`);

  // Get linked children
  const links = await db
    .select()
    .from(parentChildLinks)
    .where(eq(parentChildLinks.parentId, profile.id));

  const children = await Promise.all(
    links.map(async (link) => {
      const [child] = await db.select().from(profiles).where(eq(profiles.id, link.studentId));
      return child || null;
    })
  );
  const validChildren = children.filter(Boolean) as (typeof profiles.$inferSelect)[];

  // Get recent runs for all children
  const allRuns = await db
    .select()
    .from(agentRuns)
    .orderBy(desc(agentRuns.createdAt))
    .limit(20);

  const childIds = validChildren.map((c) => c.id);
  const childRuns = allRuns.filter((r) => childIds.includes(r.studentId));

  const [pk] = await db.select().from(providerKeys).where(eq(providerKeys.ownerProfileId, profile.id));

  const firstName = profile.displayName.split(" ")[0];

  return (
    <div className="min-h-screen" style={{ background: "#FFFDF7" }}>
      <header
        className="h-16 flex items-center justify-between px-6"
        style={{ background: "#FFFFFF", borderBottom: "2px solid #F0E7D6" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-block flex items-center justify-center"
            style={{ background: "#18B5A0" }}
          >
            <span className="text-white text-lg">👨‍👩‍👧</span>
          </div>
          <span className="font-display text-xl" style={{ color: "#2A2A3C" }}>
            Family <span style={{ color: "#18B5A0" }}>Dashboard</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <AvatarChip name={profile.displayName} size={36} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Gap 5d: COPPA — nudge unverified parents before they can create child accounts */}
        {!session.user.emailVerified && (
          <EmailVerificationNudge email={session.user.email} />
        )}

        {/* Greeting */}
        <div>
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
            WELCOME BACK
          </div>
          <h1 className="font-display text-4xl font-semibold" style={{ color: "#2A2A3C" }}>
            Hi, {firstName}! 👋
          </h1>
          <p className="font-sans text-lg mt-1" style={{ color: "#5C5747" }}>
            {validChildren.length > 0
              ? `Keeping an eye on ${validChildren.map((c) => c.displayName.split(" ")[0]).join(" & ")}'s learning`
              : "Create or link a student account to see their learning activity"}
          </p>
        </div>

        {/* Empty state / first-child CTA */}
        {validChildren.length === 0 ? (
          <div
            className="rounded-card p-10 text-center"
            style={{ background: "#FFFFFF", border: "2px dashed #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
          >
            <div className="text-6xl mb-4">👶</div>
            <div className="font-display text-2xl mb-2" style={{ color: "#2A2A3C" }}>
              Add your first student
            </div>
            <p className="font-sans mb-6" style={{ color: "#5C5747" }}>
              Create a student account directly, or link an existing one with their link code.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <CreateChildButton />
              <LinkChildButton />
            </div>
          </div>
        ) : (
          <>
            {/* Children cards */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                    MY STUDENTS

                  </div>
                  <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                    {validChildren.length} linked
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <CreateChildButton />
                  <LinkChildButton />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {validChildren.map((child) => {
                  const childRuns2 = childRuns.filter((r) => r.studentId === child.id);
                  const safeCount = childRuns2.filter((r) => r.status === "completed").length;
                  const isDemoChild = child.id === "demo_profile_child_001";
                  return (
                    <div key={child.id} className="space-y-2">
                      <Link
                        href={`/parent/children/${child.id}`}
                        className="rounded-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-1"
                        style={{ background: "#FFFFFF", border: "2px solid #F0E7D6", boxShadow: "0 18px 50px rgba(58,46,28,.12)" }}
                      >
                        <AvatarChip name={child.displayName} size={50} />
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-lg font-semibold" style={{ color: "#2A2A3C" }}>
                            {child.displayName}
                          </div>
                          <div className="font-sans text-sm mt-0.5" style={{ color: "#5C5747" }}>
                            {childRuns2.length} runs this week
                          </div>
                          <div
                            className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-pill font-mono text-[10px] font-bold"
                            style={{ background: "#D1FAE5", color: "#2E9B52" }}
                          >
                            ● {safeCount} SAFE
                          </div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8071" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                      {isDemoChild && (
                        <Link
                          href="/child/sign-in?demo=1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-pill font-sans font-extrabold text-sm transition-transform hover:-translate-y-0.5"
                          style={{ background: "#F0FDF4", color: "#16A34A", border: "1.5px solid #BBF7D0" }}
                        >
                          🎒 Try as Alex (student view) →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent activity */}
            {childRuns.length > 0 && (
              <section>
                <div className="mb-4">
                  <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8071" }}>
                    RECENT ACTIVITY
                  </div>
                  <h2 className="font-display text-2xl" style={{ color: "#2A2A3C" }}>
                    Latest runs
                  </h2>
                </div>
                <div className="space-y-2">
                  {childRuns.slice(0, 8).map((run) => {
                    const child = validChildren.find((c) => c.id === run.studentId);
                    return (
                      <div
                        key={run.id}
                        className="flex items-center gap-3 rounded-card px-4 py-3"
                        style={{ background: "#FFFFFF", border: "2px solid #F0E7D6" }}
                      >
                        <AvatarChip name={child?.displayName || "?"} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="font-sans text-sm font-extrabold truncate" style={{ color: "#2A2A3C" }}>
                            {child?.displayName?.split(" ")[0]} ran an AI Worker
                          </div>
                          <div className="font-mono text-[10px]" style={{ color: "#8A8071" }}>
                            {new Date(run.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <StatusPill status={run.status === "completed" ? "safe" : run.status === "flagged" ? "flagged" : "error"} />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* BYOK key card */}
            <section>
              <div className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "#8A8071" }}>
                AI KEY
              </div>
              <BYOKEntryCard
                connected={!!pk}
                keyTail={pk?.keyTail ?? null}
                status={pk?.status ?? null}
              />
            </section>

            {/* Reassurance strip */}
            <div
              className="rounded-card p-5 flex items-start gap-4"
              style={{ background: "#F4F0FF", border: "2px solid #7C5CFF22" }}
            >
              <div className="text-3xl flex-shrink-0">🛡</div>
              <div>
                <div className="font-sans font-extrabold" style={{ color: "#2A2A3C" }}>
                  Full transparency, always
                </div>
                <div className="font-sans text-sm mt-1" style={{ color: "#5C5747" }}>
                  You can see exactly what every AI Worker did — every step, every rule, every answer — in the Replay. Nothing is hidden.
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CreateChildButton() {
  return (
    <a
      href="/parent/children/create"
      className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-white text-sm inline-block"
      style={{ background: "#7C5CFF", boxShadow: "0 4px 0 #5B43E0" }}
    >
      + Create Student Account
    </a>
  );
}

function LinkChildButton() {
  return (
    <form action="/parent/children/link" method="get">
      <button
        type="submit"
        className="px-5 py-2.5 rounded-pill font-sans font-extrabold text-sm"
        style={{ background: "#F4F0FF", color: "#7C5CFF", border: "2px solid #7C5CFF33" }}
      >
        Link Student Account
      </button>
    </form>
  );
}
