import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { childCredentials } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { CHILD_COOKIE } from "@/lib/child-session";

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
    return NextResponse.json(
      { error: "We couldn't find that username. Ask your grown-up to check." },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(pin, cred.pinHash);
  if (!ok) {
    return NextResponse.json(
      { error: "That PIN doesn't match. Try again!" },
      { status: 401 }
    );
  }

  const token = nanoid(32);
  await db
    .update(childCredentials)
    .set({ sessionToken: token, updatedAt: new Date() })
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
