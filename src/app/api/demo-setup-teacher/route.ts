import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

    // Mark email verified (demo inbox doesn't exist)
    await db.execute(
      sql`UPDATE "user" SET "emailVerified" = true WHERE id = ${session.user.id}`
    );

    const [existingProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));

    if (!existingProfile) {
      await db.insert(profiles).values({
        id: `demo_profile_teacher_${session.user.id.slice(0, 8)}`,
        userId: session.user.id,
        displayName: "Demo Teacher",
        role: "teacher",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else if (existingProfile.role !== "teacher") {
      await db
        .update(profiles)
        .set({ role: "teacher", displayName: "Demo Teacher", updatedAt: new Date() })
        .where(eq(profiles.userId, session.user.id));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("demo-setup-teacher error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
