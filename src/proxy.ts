import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/server/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout", "/api/auth/session"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets and Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path);
  const isValid = verifySessionToken(token);

  // If already logged in and visiting /login, redirect to /
  if (pathname === "/login") {
    if (isValid) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (isPublic) {
    return NextResponse.next();
  }

  // Not authenticated or session expired
  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (token) res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }
    const loginUrl = new URL("/login", req.url);
    const res = NextResponse.redirect(loginUrl);
    if (token) res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
