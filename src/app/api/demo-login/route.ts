import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const DEMO_EMAIL    = "demo@agentfactoryjr.com";
const DEMO_PASSWORD = "Demo1234!";

export async function GET() {
  try {
    // Sign in server-side so Better Auth sets the session cookie itself
    const res = await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, rememberMe: true },
      asResponse: true,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Demo login failed:", res.status, body);
      return NextResponse.redirect(
        new URL("/sign-in?demo_error=1", process.env.BETTER_AUTH_URL || "http://localhost:3000")
      );
    }

    // Forward the Set-Cookie headers from Better Auth into the redirect response
    const redirect = NextResponse.redirect(
      new URL("/parent/dashboard", process.env.BETTER_AUTH_URL || "http://localhost:3000")
    );
    res.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        redirect.headers.append("set-cookie", value);
      }
    });

    return redirect;
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.redirect(
      new URL("/sign-in", process.env.BETTER_AUTH_URL || "http://localhost:3000")
    );
  }
}
