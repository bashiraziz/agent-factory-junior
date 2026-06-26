import { NextRequest, NextResponse } from "next/server";

const ROLE_PREFIXES = ["student", "teacher", "parent", "admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find which role prefix this route is under
  const matchedRole = ROLE_PREFIXES.find((role) =>
    pathname.startsWith(`/${role}/`)
  );
  if (!matchedRole) return NextResponse.next();

  // Check for a Better Auth session cookie
  // Better Auth sets a cookie named "better-auth.session_token" by default
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie?.value) {
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
