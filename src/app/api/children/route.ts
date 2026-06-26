import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { parentChildLinks, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });
  if (profile.role !== "parent") return NextResponse.json({ error: "Parents only" }, { status: 403 });

  const links = await db
    .select()
    .from(parentChildLinks)
    .where(eq(parentChildLinks.parentId, profile.id));

  // Fetch child profiles
  const children = await Promise.all(
    links.map(async (link) => {
      const [child] = await db.select().from(profiles).where(eq(profiles.id, link.studentId));
      return child || null;
    })
  );

  return NextResponse.json(children.filter(Boolean));
}
