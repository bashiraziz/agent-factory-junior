import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    // Sign in server-side — returns { token, user } with no cookie-forwarding needed
    const result = await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true },
      headers: new Headers(),
    }) as { token?: string; user?: { id: string } } | null;

    if (!result?.token) {
      console.error("Demo login: no token returned", result);
      return NextResponse.redirect(new URL("/sign-in", origin));
    }

    const jar = await cookies();

    // Clear any stale child/seat/role cookies so old sessions don't hijack the redirect
    for (const name of ["afj-child-session", "afj-seat-session", "afj-role"]) {
      jar.delete(name);
    }

    // Set the Better Auth session cookie directly
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
