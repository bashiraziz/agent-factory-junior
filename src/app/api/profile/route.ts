import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, profiles } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid, generateCode } from "@/lib/utils";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, displayName } = await req.json();
  const validRoles = ["student", "teacher", "parent", "admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Upsert profile
  const existing = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (existing.length > 0) {
    await db.update(profiles).set({ role, displayName, updatedAt: new Date() }).where(eq(profiles.userId, session.user.id));
  } else {
    await db.insert(profiles).values({
      id: nanoid(),
      userId: session.user.id,
      displayName: displayName || session.user.name || session.user.email,
      role,
      linkCode: role === "student" ? generateCode() : null,
    });
  }

  const response = NextResponse.json({ ok: true, role });
  // Set a lightweight role cookie so middleware can redirect without a DB call
  response.cookies.set("afj-role", role, {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
  return response;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  const response = NextResponse.json(profile || null);
  // Refresh the role cookie on every profile fetch
  if (profile?.role) {
    response.cookies.set("afj-role", profile.role, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
