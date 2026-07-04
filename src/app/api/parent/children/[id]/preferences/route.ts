import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { parentChildLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveParent, verifyParentChildLink } from "@/lib/parent-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: studentId } = await params;
  const parent = await resolveParent();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const link = await verifyParentChildLink(parent.id, studentId);
  if (!link) return NextResponse.json({ error: "Not your child" }, { status: 403 });

  const { emailOnFlag, emailWeeklyReport, requireApproval } = await req.json();
  const patch: Record<string, unknown> = {};
  if (typeof emailOnFlag === "boolean") patch.emailOnFlag = emailOnFlag;
  if (typeof emailWeeklyReport === "boolean") patch.emailWeeklyReport = emailWeeklyReport;
  if (typeof requireApproval === "boolean") patch.requireApproval = requireApproval;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(parentChildLinks)
    .set(patch)
    .where(
      and(eq(parentChildLinks.parentId, parent.id), eq(parentChildLinks.studentId, studentId))
    );
  return NextResponse.json({ ok: true });
}
