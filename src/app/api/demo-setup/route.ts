import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { purgeDemoChildren } from "@/lib/demo-reset";

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

    // Mark email verified (demo inbox doesn't exist)
    await db.execute(
      sql`UPDATE "user" SET "emailVerified" = true WHERE id = ${session.user.id}`
    );

    // Ensure role is parent and fetch profile
    await db
      .update(profiles)
      .set({ role: "parent", updatedAt: new Date() })
      .where(eq(profiles.userId, session.user.id));

    const [parentProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id));

    if (parentProfile) {
      await purgeDemoChildren(parentProfile.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("demo-setup error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
