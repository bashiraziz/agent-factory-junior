import { db } from "@/db";
import { usageLimits, projects, parentChildLinks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";

export const CHAT_TURNS_PER_RUN = 5;

type Project = InferSelectModel<typeof projects>;
type UsageLimits = InferSelectModel<typeof usageLimits>;

export class GuardrailError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function loadOrCreateUsage(studentId: string, now: Date): Promise<UsageLimits> {
  const [existing] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, studentId));
  if (existing) return existing;
  const [created] = await db
    .insert(usageLimits)
    .values({
      id: nanoid(),
      userId: studentId,
      dailyRunLimit: 5,
      runsUsedToday: 0,
      periodStart: now,
    })
    .returning();
  return created;
}

export async function assertNotPaused(studentId: string): Promise<UsageLimits> {
  const now = new Date();
  let usage = await loadOrCreateUsage(studentId, now);

  // Calendar-day reset — comparison in server local time.
  if (!isSameCalendarDay(new Date(usage.periodStart), now)) {
    await db
      .update(usageLimits)
      .set({ runsUsedToday: 0, periodStart: now, updatedAt: now })
      .where(eq(usageLimits.userId, studentId));
    usage = { ...usage, runsUsedToday: 0, periodStart: now };
  }

  if (usage.paused) {
    throw new GuardrailError(
      "Your grown-up has paused AI Worker runs. Ask them to unpause it in the family dashboard."
    );
  }
  return usage;
}

export async function assertApproved(project: Project, studentId: string): Promise<void> {
  if (project.parentApprovedAt) return;
  const links = await db
    .select()
    .from(parentChildLinks)
    .where(
      and(
        eq(parentChildLinks.studentId, studentId),
        eq(parentChildLinks.requireApproval, true)
      )
    );
  if (links.length > 0) {
    throw new GuardrailError(
      "Waiting for a grown-up's OK. Ask a parent to approve this AI Worker in the family dashboard."
    );
  }
}

/**
 * Check the run limit and atomically bump the counter. Returns the *new*
 * counter value so callers can report progress.
 *
 * `weight` lets chat count as a fraction of a run (see CHAT_TURNS_PER_RUN).
 */
export async function consumeRun(
  studentId: string,
  usage: UsageLimits,
  weight = 1
): Promise<{ runsUsedToday: number; dailyRunLimit: number }> {
  const bypass =
    !!process.env.DEV_UNLIMITED_RUNS && process.env.DEV_UNLIMITED_RUNS !== "0";
  if (!bypass && usage.runsUsedToday >= usage.dailyRunLimit) {
    throw new GuardrailError(
      `Daily run limit reached (${usage.dailyRunLimit} runs). Try again tomorrow!`
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(usageLimits)
    .set({
      runsUsedToday: sql`${usageLimits.runsUsedToday} + ${weight}`,
      updatedAt: now,
    })
    .where(eq(usageLimits.userId, studentId))
    .returning({ runsUsedToday: usageLimits.runsUsedToday, dailyRunLimit: usageLimits.dailyRunLimit });

  // Post-check: if a parallel request pushed us over, we can't undo cleanly
  // without a transaction. Enforce the ceiling by re-checking after write.
  if (!bypass && updated.runsUsedToday > updated.dailyRunLimit) {
    // Roll back the increment we just made.
    await db
      .update(usageLimits)
      .set({
        runsUsedToday: sql`${usageLimits.runsUsedToday} - ${weight}`,
        updatedAt: now,
      })
      .where(eq(usageLimits.userId, studentId));
    throw new GuardrailError(
      `Daily run limit reached (${updated.dailyRunLimit} runs). Try again tomorrow!`
    );
  }

  return updated;
}
