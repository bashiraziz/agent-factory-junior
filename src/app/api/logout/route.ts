import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { childCredentials, classroomSeatCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SEAT_COOKIE } from "@/lib/seat-session";
import { CHILD_COOKIE } from "@/lib/child-session";

export async function POST() {
  const jar = await cookies();

  const seatToken = jar.get(SEAT_COOKIE)?.value;
  if (seatToken) {
    await db
      .update(classroomSeatCodes)
      .set({ sessionToken: null })
      .where(eq(classroomSeatCodes.sessionToken, seatToken));
  }

  const childToken = jar.get(CHILD_COOKIE)?.value;
  if (childToken) {
    await db
      .update(childCredentials)
      .set({ sessionToken: null, updatedAt: new Date() })
      .where(eq(childCredentials.sessionToken, childToken));
  }

  const clearOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SEAT_COOKIE, "", clearOpts);
  res.cookies.set(CHILD_COOKIE, "", clearOpts);
  return res;
}
