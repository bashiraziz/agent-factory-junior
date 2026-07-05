import { NextRequest, NextResponse } from "next/server";
import { resetDemoData } from "@/lib/demo-reset";

// Runs every 4 days via Vercel Cron (see vercel.json)
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await resetDemoData();
  console.log(`[cron/demo-reset] Purged ${result.deleted} demo child account(s)`);
  return NextResponse.json({ ok: true, ...result });
}
