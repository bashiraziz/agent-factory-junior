import { db } from "@/db";
import { usageLimits, projects, parentChildLinks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import type { InferSelectModel } from "drizzle-orm";

export const CHAT_TURNS_PER_RUN = 5;
// Default daily run limit granted when a parent/teacher BYOK key is active.
export const BYOK_DAILY_RUN_LIMIT = 25;

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

// DEV_UNLIMITED_RUNS is silently ignored when NODE_ENV=production.
function devBypass(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    !!process.env.DEV_UNLIMITED_RUNS &&
    process.env.DEV_UNLIMITED_RUNS !== "0"
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
      chatTurnsUsedToday: 0,
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
      .set({ runsUsedToday: 0, chatTurnsUsedToday: 0, periodStart: now, updatedAt: now })
      .where(eq(usageLimits.userId, studentId));
    usage = { ...usage, runsUsedToday: 0, chatTurnsUsedToday: 0, periodStart: now };
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
 * Atomically consume one full run against the daily limit.
 * Pass byokActive=true when a BYOK key is in use to apply the boosted ceiling.
 */
export async function consumeRun(
  studentId: string,
  usage: UsageLimits,
  { byokActive = false }: { byokActive?: boolean } = {}
): Promise<{ runsUsedToday: number; dailyRunLimit: number }> {
  if (devBypass()) {
    return { runsUsedToday: usage.runsUsedToday, dailyRunLimit: usage.dailyRunLimit };
  }

  const effectiveLimit = byokActive
    ? Math.max(usage.dailyRunLimit, BYOK_DAILY_RUN_LIMIT)
    : usage.dailyRunLimit;

  const now = new Date();
  const [updated] = await db
    .update(usageLimits)
    .set({ runsUsedToday: sql`${usageLimits.runsUsedToday} + 1`, updatedAt: now })
    .where(
      and(
        eq(usageLimits.userId, studentId),
        sql`${usageLimits.runsUsedToday} < ${effectiveLimit}`
      )
    )
    .returning({
      runsUsedToday: usageLimits.runsUsedToday,
      dailyRunLimit: usageLimits.dailyRunLimit,
    });

  if (!updated) {
    throw new GuardrailError(
      `Daily run limit reached (${effectiveLimit} runs). Try again tomorrow!`
    );
  }

  return updated;
}

/**
 * Atomically consume one chat turn. Every CHAT_TURNS_PER_RUN turns counts as
 * one full run. Pass byokActive=true to apply the boosted ceiling.
 */
export async function consumeChatTurn(
  studentId: string,
  usage: UsageLimits,
  { byokActive = false }: { byokActive?: boolean } = {}
): Promise<void> {
  if (devBypass()) return;

  const effectiveLimit = byokActive
    ? Math.max(usage.dailyRunLimit, BYOK_DAILY_RUN_LIMIT)
    : usage.dailyRunLimit;

  const now = new Date();
  const [updated] = await db
    .update(usageLimits)
    .set({ chatTurnsUsedToday: sql`${usageLimits.chatTurnsUsedToday} + 1`, updatedAt: now })
    .where(
      and(
        eq(usageLimits.userId, studentId),
        sql`${usageLimits.chatTurnsUsedToday} < (${effectiveLimit} - ${usageLimits.runsUsedToday}) * ${CHAT_TURNS_PER_RUN}`
      )
    )
    .returning({ chatTurnsUsedToday: usageLimits.chatTurnsUsedToday });

  if (!updated) {
    throw new GuardrailError(
      `Daily run limit reached (${effectiveLimit} runs). Try again tomorrow!`
    );
  }
}
