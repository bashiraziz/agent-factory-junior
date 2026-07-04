import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveStudentProfile } from "@/lib/student-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [project] = await db.select().from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, profile.id)));
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (project.status !== "published") {
    return NextResponse.json({ error: "Publish your Worker first." }, { status: 400 });
  }

  if (project.shareStatus === "approved" || project.shareStatus === "pending") {
    return NextResponse.json({ error: "Already submitted or approved." }, { status: 400 });
  }

  await db.update(projects).set({ shareStatus: "pending" }).where(eq(projects.id, id));
  return NextResponse.json({ shareStatus: "pending" });
}
