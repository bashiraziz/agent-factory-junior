import { NextRequest, NextResponse } from "next/server";
import { SEAT_COOKIE } from "@/lib/seat-session";

const ROLE_PREFIXES = ["student", "teacher", "parent", "admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedRole = ROLE_PREFIXES.find((role) =>
    pathname.startsWith(`/${role}/`)
  );
  if (!matchedRole) return NextResponse.next();

  // Better Auth session covers all roles
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  // Seat-code session covers /student/* only (no account, Track A)
  const seatCookie = request.cookies.get(SEAT_COOKIE);

  const isAuthenticated =
    !!sessionCookie?.value ||
    (matchedRole === "student" && !!seatCookie?.value);

  if (!isAuthenticated) {
    if (matchedRole === "student") {
      // Offer both sign-in and /join for unauthenticated student routes
      const url = request.nextUrl.clone();
      url.pathname = "/join";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Role-mismatch check: read the afj-role cookie set by the profile API after onboarding.
  // If missing, let the request through — the server component will handle the redirect.
  const roleCookie = request.cookies.get("afj-role");
  if (roleCookie?.value && roleCookie.value !== matchedRole) {
    const url = request.nextUrl.clone();
    url.pathname = `/${roleCookie.value}/dashboard`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/admin/:path*",
  ],
};
