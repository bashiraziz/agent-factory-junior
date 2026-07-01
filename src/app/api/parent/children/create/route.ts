import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { profiles, childCredentials, parentChildLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveParent } from "@/lib/parent-auth";

export async function POST(req: NextRequest) {
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  await db.insert(parentChildLinks).values({
    id: nanoid(),
    parentId: parent.id,
    studentId: profileId,
    linkCode,
  });

  return NextResponse.json({ ok: true, profileId, username: usernameRaw });
}
