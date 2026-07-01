import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { usageLimits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveParent, verifyParentChildLink } from "@/lib/parent-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const link = await verifyParentChildLink(parent.id, studentId);
  if (!link) return NextResponse.json({ error: "Not your child" }, { status: 403 });

  const { dailyRunLimit, paused, resetToday } = await req.json();

  const [existing] = await db.select().from(usageLimits).where(eq(usageLimits.userId, studentId));
  const now = new Date();

  if (!existing) {
    await db.insert(usageLimits).values({
      id: nanoid(),
      userId: studentId,
      dailyRunLimit: typeof dailyRunLimit === "number" ? clampLimit(dailyRunLimit) : 5,
      runsUsedToday: 0,
      paused: paused === true,
      periodStart: now,
    });
    return NextResponse.json({ ok: true });
  }

  const patch: Record<string, unknown> = { updatedAt: now };
  if (typeof dailyRunLimit === "number") patch.dailyRunLimit = clampLimit(dailyRunLimit);
  if (typeof paused === "boolean") patch.paused = paused;
  if (resetToday === true) {
    patch.runsUsedToday = 0;
    patch.periodStart = now;
  }

  await db.update(usageLimits).set(patch).where(eq(usageLimits.userId, studentId));
  return NextResponse.json({ ok: true });
}

function clampLimit(n: number): number {
  return Math.max(1, Math.min(50, Math.floor(n)));
}
