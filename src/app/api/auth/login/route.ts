import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth";
import { handleRoute, checkRateLimit, UnauthorizedError } from "@/server/core";
import { loginSchema } from "@/schemas";
import type { AuthResponse } from "@/types";

export const POST = handleRoute(async (req: NextRequest) => {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  checkRateLimit(`login:${clientIp}`, 10, 60_000);

  const body = loginSchema.parse(await req.json());
  if (body.username && body.username.toLowerCase() !== "admin") {
    throw new UnauthorizedError("Invalid username or password");
  }

  const isValid = await verifyPassword(body.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid username or password");
  }

  const token = createSessionToken();
  const res = NextResponse.json<AuthResponse>({ success: true });

  const isHttps =
    req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto")?.includes("https");

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(isHttps),
    path: "/",
    ...(body.rememberMe !== false ? { maxAge: 7 * 24 * 60 * 60 } : {}),
  });

  return res;
});
