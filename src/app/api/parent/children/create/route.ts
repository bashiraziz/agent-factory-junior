import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles, childCredentials, parentChildLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveParent } from "@/lib/parent-auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Gap 5b: Require email verification before creating a child account (COPPA "email plus" VPC)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.emailVerified) {
    return NextResponse.json(
      { error: "Please verify your email first — check your inbox or request a new link from your dashboard." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const displayName = String(body?.displayName ?? "").trim();
  const usernameRaw = String(body?.username ?? "").trim().toLowerCase();
  const pin = String(body?.pin ?? "").trim();

  if (!displayName) {
    return NextResponse.json({ error: "Please enter a name for your child." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]{3,20}$/.test(usernameRaw)) {
    return NextResponse.json(
      { error: "Username must be 3–20 letters, numbers, - or _." },
      { status: 400 }
    );
  }
  if (/\b(199\d|20[0-2]\d)\b/.test(usernameRaw)) {
    return NextResponse.json(
      { error: "Avoid using a birth year in the username — try a fun nickname instead." },
      { status: 400 }
    );
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }

  const [existingUsername] = await db
    .select({ id: childCredentials.id })
    .from(childCredentials)
    .where(eq(childCredentials.username, usernameRaw));

  if (existingUsername) {
    return NextResponse.json(
      { error: "That username is taken — try another." },
      { status: 409 }
    );
  }

  const profileId = nanoid();
  const userId = `child_${nanoid(16)}`;
  const linkCode = nanoid(8).toUpperCase();
  const now = new Date();

  await db.insert(profiles).values({
    id: profileId,
    userId,
    displayName,
    role: "student",
    linkCode,
  });

  const pinHash = await bcrypt.hash(pin, 10);
  await db.insert(childCredentials).values({
    id: nanoid(),
    profileId,
    parentId: parent.id,
    username: usernameRaw,
    pinHash,
  });

  // Gap 2 + 5c: Record consent timestamp and email-verification timestamp (COPPA audit trail)
  await db.insert(parentChildLinks).values({
    id: nanoid(),
    parentId: parent.id,
    studentId: profileId,
    linkCode,
    consentedAt: now,
    parentEmailVerifiedAt: now,
  });

  return NextResponse.json({ ok: true, profileId, username: usernameRaw });
}
