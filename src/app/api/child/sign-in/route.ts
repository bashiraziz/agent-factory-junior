import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { childCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { CHILD_COOKIE } from "@/lib/child-session";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Same message for unknown username and wrong PIN — prevents username enumeration.
const GENERIC_ERROR = "That username and PIN don't match. Try again!";
const LOCKED_ERROR = `Too many tries! Take a ${LOCKOUT_MINUTES}-minute break, then try again.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? "").trim().toLowerCase();
  const pin = String(body?.pin ?? "").trim();

  if (!username || !/^\d{4}$/.test(pin)) {
    return NextResponse.json(
      { error: "Enter your username and 4-digit PIN." },
      { status: 400 }
    );
  }

  const [cred] = await db
    .select()
    .from(childCredentials)
    .where(eq(childCredentials.username, username));

  if (!cred) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const now = new Date();
  if (cred.lockedUntil && cred.lockedUntil > now) {
    return NextResponse.json({ error: LOCKED_ERROR }, { status: 429 });
  }

  const ok = await bcrypt.compare(pin, cred.pinHash);
  if (!ok) {
    const nextFailed = cred.failedAttempts + 1;
    if (nextFailed >= MAX_ATTEMPTS) {
      const lockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      await db
        .update(childCredentials)
        .set({ failedAttempts: 0, lockedUntil, updatedAt: now })
        .where(eq(childCredentials.id, cred.id));
      return NextResponse.json({ error: LOCKED_ERROR }, { status: 429 });
    }
    await db
      .update(childCredentials)
      .set({ failedAttempts: nextFailed, updatedAt: now })
      .where(eq(childCredentials.id, cred.id));
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const token = nanoid(32);
  await db
    .update(childCredentials)
    .set({
      sessionToken: token,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: now,
    })
    .where(eq(childCredentials.id, cred.id));

  const jar = await cookies();
  jar.set(CHILD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ ok: true });
}
