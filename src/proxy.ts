import { NextRequest, NextResponse } from "next/server";
import { SEAT_COOKIE } from "@/lib/seat-session";

const CHILD_COOKIE = "afj-child-session";
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

  // PIN-credential session covers /student/* (PIN-based, no Better Auth account)
  const childCookie = request.cookies.get(CHILD_COOKIE);

  // Seat-code session covers /student/* only (no account, Track A)
  const seatCookie = request.cookies.get(SEAT_COOKIE);

  const isStudent = matchedRole === "student";
  const isAuthenticated =
    !!sessionCookie?.value ||
    (isStudent && (!!seatCookie?.value || !!childCookie?.value));

  if (!isAuthenticated) {
    if (isStudent) {
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
  // Skip when a student PIN cookie is present — PIN-auth students are always /student/* regardless
  // of any adult session that may be lingering in the same browser (e.g. demo parent + demo student).
  const roleCookie = request.cookies.get("afj-role");
  if (!childCookie?.value && roleCookie?.value && roleCookie.value !== matchedRole) {
    const url = request.nextUrl.clone();
    url.pathname = `/${roleCookie.value}/dashboard`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/((?!sign-in).*)",
    "/teacher/:path*",
    "/parent/:path*",
    "/admin/:path*",
  ],
};
