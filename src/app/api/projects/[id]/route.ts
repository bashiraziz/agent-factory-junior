import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";
import { validateProject } from "@/lib/runtime/validate-project";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(500).optional().nullable(),
  dslJson: z.unknown().optional(),
  blocklyJson: z.unknown().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

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

  const raw = await req.json();
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Some fields didn't look right." }, { status: 400 });
  }
  const body = parsed.data;
  const allowed: Record<string, unknown> = {};
  if (body.name !== undefined) allowed.name = body.name;
  if (body.description !== undefined) allowed.description = body.description;
  if (body.dslJson !== undefined) {
    if (JSON.stringify(body.dslJson).length > 200_000) {
      return NextResponse.json({ error: "That's a lot of blocks! Try simplifying your Worker a bit." }, { status: 400 });
    }
    const v = validateProject(body.dslJson);
    if (!v.valid) {
      return NextResponse.json({ error: v.errors[0] ?? "Project blocks aren't ready yet." }, { status: 400 });
    }
    allowed.dslJson = body.dslJson;
  }
  if (body.blocklyJson !== undefined) {
    if (JSON.stringify(body.blocklyJson).length > 200_000) {
      return NextResponse.json({ error: "That's a lot of blocks! Try simplifying your Worker a bit." }, { status: 400 });
    }
    allowed.blocklyJson = body.blocklyJson;
  }
  if (body.status !== undefined) allowed.status = body.status;
  // Editing blocks clears parent approval — must be re-approved before next run.
  if (body.dslJson !== undefined || body.blocklyJson !== undefined) {
    allowed.parentApprovedAt = null;
  }
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
