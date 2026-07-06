import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { CHILD_COOKIE } from "@/lib/student-session";

export async function POST() {
  const jar = await cookies();
  jar.delete(CHILD_COOKIE);
  return NextResponse.json({ ok: true });
}
