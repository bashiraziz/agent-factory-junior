import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveStudentProfile } from "@/lib/student-auth";

export async function GET() {
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, profile.id))
    .orderBy(projects.updatedAt);

  return NextResponse.json(rows.reverse());
}

export async function POST(req: NextRequest) {
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const id = nanoid();
  const now = new Date();

  const [project] = await db
    .insert(projects)
    .values({
      id,
      ownerId: profile.id,
      name: name.trim(),
      description: description?.trim() || null,
      dslJson: {
        version: "1",
        name: name.trim(),
        description: description?.trim() || "",
        goal: "",
        knowledge: [],
        rules: [],
        steps: [],
        approval_required: [],
      },
      blocklyJson: null,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
