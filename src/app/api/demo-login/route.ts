import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { purgeDemoChildren } from "@/lib/demo-reset";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    const result = await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true },
      headers: new Headers(),
    }) as { token?: string; user?: { id: string } } | null;

    if (!result?.token) {
      console.error("Demo login: no token returned", result);
      return NextResponse.redirect(new URL("/sign-in", origin));
    }

    if (result.user?.id) {
      const [parentProfile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, result.user.id));

      if (parentProfile) {
        await db
          .update(profiles)
          .set({ role: "parent", updatedAt: new Date() })
          .where(eq(profiles.userId, result.user.id));

        // Remove child accounts added by previous demo visitors
        await purgeDemoChildren(parentProfile.id);
      }

      // Mark email as verified — demo@agentfactoryjr.com has no real inbox
      await db.execute(
        sql`UPDATE "user" SET "emailVerified" = true WHERE id = ${result.user.id}`
      );
    }

    const jar = await cookies();
    for (const name of ["afj-child-session", "afj-seat-session", "afj-role"]) {
      jar.delete(name);
    }

    jar.set("better-auth.session_token", result.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.redirect(new URL("/parent/dashboard", origin));
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
}
