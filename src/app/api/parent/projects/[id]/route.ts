import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveParent, verifyParentChildLink } from "@/lib/parent-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Approve a worker
  const { id } = await params;
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await verifyParentChildLink(parent.id, project.ownerId);
  if (!link) return NextResponse.json({ error: "Not your student's worker" }, { status: 403 });

  await db
    .update(projects)
    .set({ parentApprovedAt: new Date() })
    .where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const link = await verifyParentChildLink(parent.id, project.ownerId);
  if (!link) return NextResponse.json({ error: "Not your student's worker" }, { status: 403 });

  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
