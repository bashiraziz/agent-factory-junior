import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, profile.id)));

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(projects).where(eq(projects.id, id));

  return new NextResponse(null, { status: 204 });
}
