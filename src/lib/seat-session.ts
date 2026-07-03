import { cookies } from "next/headers";
import { db } from "@/db";
import { classroomSeatCodes, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SEAT_COOKIE = "afj-seat-session";

export async function getSeatProfile() {
  const token = (await cookies()).get(SEAT_COOKIE)?.value;
  if (!token) return null;

  const [seat] = await db
    .select()
    .from(classroomSeatCodes)
    .where(eq(classroomSeatCodes.sessionToken, token));

  if (!seat?.isActive || !seat.profileId || (seat.expiresAt && seat.expiresAt < new Date())) return null;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, seat.profileId));

  return profile ?? null;
}
