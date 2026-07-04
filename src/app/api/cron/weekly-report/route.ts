import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, parentChildLinks, agentRuns, projects, lessonProgress } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { CORE_CHAPTERS } from "@/lib/lessons/book-chapters";
import { renderWeeklyReport, type ChildSummary } from "@/lib/email/weekly-report";
import { sendEmail } from "@/lib/email/resend";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekStart = weekAgo.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const weekEnd = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const weekOf = `${weekStart} – ${weekEnd}`;

  const links = await db
    .select()
    .from(parentChildLinks)
    .where(eq(parentChildLinks.emailWeeklyReport, true));

  if (links.length === 0) return NextResponse.json({ sent: 0 });

  const byParent = new Map<string, string[]>();
  for (const link of links) {
    const arr = byParent.get(link.parentId) ?? [];
    arr.push(link.studentId);
    byParent.set(link.parentId, arr);
  }

  let sent = 0;

  for (const [parentId, childIds] of byParent) {
    const [parentProfile] = await db.select().from(profiles).where(eq(profiles.id, parentId));
    if (!parentProfile) continue;

    // Better Auth stores email on the "user" table — query it directly.
    const rows = await db.execute(
      sql`SELECT email FROM "user" WHERE id = ${parentProfile.userId} LIMIT 1`
    );
    const email = (rows as { rows?: { email?: string }[] }).rows?.[0]?.email;
    if (!email) continue;

    const childSummaries: ChildSummary[] = [];

    for (const childId of childIds) {
      const [child] = await db.select().from(profiles).where(eq(profiles.id, childId));
      if (!child) continue;

      const weekRuns = await db
        .select()
        .from(agentRuns)
        .where(and(eq(agentRuns.studentId, childId), gte(agentRuns.createdAt, weekAgo)));

      const childProjects = await db.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, childId));

      const progressRows = await db
        .select({ chapterId: lessonProgress.chapterId, completedAt: lessonProgress.completedAt })
        .from(lessonProgress)
        .where(eq(lessonProgress.studentId, childId));

      const thisWeekBadges = progressRows
        .filter((r) => r.completedAt && new Date(r.completedAt) >= weekAgo)
        .map((r) => {
          const chapter = CORE_CHAPTERS.find((c) => c.id === r.chapterId);
          return chapter ? `${chapter.badge.emoji} ${chapter.badge.name}` : null;
        })
        .filter(Boolean) as string[];

      const completedCoreIds = new Set(
        progressRows.filter((r) => CORE_CHAPTERS.some((c) => c.id === r.chapterId)).map((r) => r.chapterId)
      );

      childSummaries.push({
        name: child.displayName.split(" ")[0],
        runsThisWeek: weekRuns.length,
        safeRuns: weekRuns.filter((r) => r.status === "completed").length,
        flaggedRuns: weekRuns.filter((r) => r.status === "flagged").length,
        workersBuilt: childProjects.length,
        badgesEarned: thisWeekBadges,
        lessonLevel: completedCoreIds.size > 0 ? completedCoreIds.size : null,
      });
    }

    if (childSummaries.length === 0) continue;

    const html = await renderWeeklyReport({
      parentName: parentProfile.displayName.split(" ")[0],
      children: childSummaries,
      weekOf,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://agentfactoryjr.com"}/parent/dashboard`,
    });

    await sendEmail({
      to: email,
      subject: `${childSummaries.map((c) => c.name).join(" & ")}'s AI learning this week`,
      html,
    });

    sent++;
  }

  return NextResponse.json({ sent });
}
