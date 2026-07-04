import { type NextRequest, NextResponse } from "next/server";
import { resolveStudentProfile } from "@/lib/student-auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const PATH_SENTINEL = "AFJ_LESSON_PATH";

export async function GET(_req: NextRequest) {
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.ownerId, profile.id), eq(projects.description, PATH_SENTINEL)));

  if (existing) return NextResponse.json({ projectId: existing.id });

  const id = crypto.randomUUID();
  await db.insert(projects).values({
    id,
    ownerId: profile.id,
    name: "My AI Buddy",
    description: PATH_SENTINEL,
    status: "draft",
    dslJson: null,
    blocklyJson: null,
  });

  return NextResponse.json({ projectId: id });
}
