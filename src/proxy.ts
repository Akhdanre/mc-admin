import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "mc_admin_session";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/session",
];

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

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path);

  // If already logged in and visiting /login, redirect to /
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublic) {
    return NextResponse.next();
  }

  // Not authenticated
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
