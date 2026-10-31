import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth";
import { handleRoute, checkRateLimit, UnauthorizedError } from "@/server/core";
import { loginSchema } from "@/schemas";
import type { AuthResponse } from "@/types";

export const POST = handleRoute(async (req: NextRequest) => {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  checkRateLimit(`login:${clientIp}`, 10, 60_000);

  const body = loginSchema.parse(await req.json());
  const isValid = await verifyPassword(body.password);
  if (!isValid) {
    throw new UnauthorizedError("Invalid password");
  }

  const token = createSessionToken();
  const res = NextResponse.json<AuthResponse>({ success: true });

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return res;
});
