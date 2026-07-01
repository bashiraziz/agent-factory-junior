import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { classroomSeatCodes, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { SEAT_COOKIE } from "@/lib/seat-session";

export async function POST(req: NextRequest) {
  const { code, nickname } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const [seat] = await db
    .select()
    .from(classroomSeatCodes)
    .where(eq(classroomSeatCodes.code, code.trim().toUpperCase()));

  if (!seat) {
    return NextResponse.json({ error: "Code not found — check with your teacher." }, { status: 404 });
  }
  if (!seat.isActive) {
    return NextResponse.json({ error: "This code is no longer active." }, { status: 403 });
  }
  if (seat.expiresAt && new Date() > seat.expiresAt) {
    return NextResponse.json({ error: "This code has expired." }, { status: 403 });
  }

  if (seat.sessionToken || seat.profileId) {
    return NextResponse.json(
      { error: "This code is already being used. Ask your teacher for a new one!" },
      { status: 403 }
    );
  }

  const displayName = nickname?.trim() || "Student";
  const profileId = nanoid();
  const sessionToken = nanoid(32);
  const now = new Date();

  await db.insert(profiles).values({
    id: profileId,
    userId: `seat:${seat.id}`,
    displayName,
    role: "student",
    createdAt: now,
    updatedAt: now,
  });

  await db
    .update(classroomSeatCodes)
    .set({ profileId, sessionToken, joinedAt: now })
    .where(eq(classroomSeatCodes.id, seat.id));

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SEAT_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // one school day
  });
  return response;
}
