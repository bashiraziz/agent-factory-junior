import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  try {
    const res = await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true },
      asResponse: true,
    });

    if (!res.ok) {
      console.error("Demo login failed:", res.status, await res.text());
      return NextResponse.redirect(new URL("/sign-in", origin));
    }

    const redirect = NextResponse.redirect(new URL("/parent/dashboard", origin));

    // getSetCookie() returns each Set-Cookie header as a separate string,
    // preserving attributes (Path, HttpOnly, SameSite, etc.)
    const cookies: string[] =
      typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : res.headers.get("set-cookie")?.split(/,(?=\s*\w+=)/) ?? [];

    for (const cookie of cookies) {
      redirect.headers.append("set-cookie", cookie);
    }

    return redirect;
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.redirect(new URL("/sign-in", origin));
  }
}
