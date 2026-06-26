import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { projects, profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, profile.id)));

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, session.user.id));
  if (!profile) return NextResponse.json({ error: "No profile" }, { status: 403 });

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, profile.id)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if ("name" in body) allowed.name = body.name;
  if ("description" in body) allowed.description = body.description;
  if ("dslJson" in body) allowed.dslJson = body.dslJson;
  if ("blocklyJson" in body) allowed.blocklyJson = body.blocklyJson;
  if ("status" in body) allowed.status = body.status;
  allowed.updatedAt = new Date();

  const [updated] = await db
    .update(projects)
    .set(allowed)
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json(updated);
}
