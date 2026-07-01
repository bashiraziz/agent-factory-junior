import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "@/lib/utils";
import { resolveStudentProfile } from "@/lib/student-auth";
import { getTemplate, dslToBlocklyJson } from "@/lib/templates/starter-templates";

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

  const { name, description, templateId } = await req.json();

  const template = templateId ? getTemplate(templateId) : undefined;
  if (templateId && !template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  const finalName = (name?.trim() || template?.dsl.defaultName || "").trim();
  if (!finalName) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const finalDescription = description?.trim() || template?.dsl.defaultDescription || "";

  const id = nanoid();
  const now = new Date();

  const dslJson = template
    ? {
        version: "1",
        name: finalName,
        description: finalDescription,
        goal: template.dsl.goal,
        knowledge: template.dsl.knowledge,
        rules: template.dsl.rules,
        steps: template.dsl.steps,
        approval_required: template.dsl.approval_required,
      }
    : {
        version: "1",
        name: finalName,
        description: finalDescription,
        goal: "",
        knowledge: [],
        rules: [],
        steps: [],
        approval_required: [],
      };

  const blocklyJson = template
    ? dslToBlocklyJson({
        goal: template.dsl.goal,
        knowledge: template.dsl.knowledge,
        rules: template.dsl.rules,
        steps: template.dsl.steps,
      })
    : null;

  const [project] = await db
    .insert(projects)
    .values({
      id,
      ownerId: profile.id,
      name: finalName,
      description: finalDescription || null,
      dslJson,
      blocklyJson,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
