import { NextRequest, NextResponse } from "next/server";
import { runWorker } from "@/lib/runtime/run-worker";
import { resolveStudentProfile } from "@/lib/student-auth";
import { GuardrailError } from "@/lib/runtime/guardrails";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });

  try {
    const result = await runWorker(id, profile.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof GuardrailError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
