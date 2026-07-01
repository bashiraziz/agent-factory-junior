import { NextRequest, NextResponse } from "next/server";
import { chatWorker } from "@/lib/runtime/chat-worker";
import { resolveStudentProfile } from "@/lib/student-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await resolveStudentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role !== "student") return NextResponse.json({ error: "Students only" }, { status: 403 });

  const { history, userMessage } = await req.json();
  if (typeof userMessage !== "string" || !userMessage.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    const result = await chatWorker(id, profile.id, history ?? [], userMessage.trim());
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
