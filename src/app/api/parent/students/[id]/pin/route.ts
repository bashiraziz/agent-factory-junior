import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { childCredentials, parentChildLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveParent } from "@/lib/parent-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify this child is actually linked to the requesting parent.
  const [link] = await db
    .select()
    .from(parentChildLinks)
    .where(
      and(
        eq(parentChildLinks.parentId, parent.id),
        eq(parentChildLinks.studentId, studentId)
      )
    );
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const pin = String(body?.pin ?? "").trim();

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }

  const pinHash = await bcrypt.hash(pin, 10);
  const now = new Date();

  await db
    .update(childCredentials)
    .set({
      pinHash,
      sessionToken: null,   // force re-login with new PIN
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: now,
    })
    .where(eq(childCredentials.profileId, studentId));

  return NextResponse.json({ ok: true });
}
