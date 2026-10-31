import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/server/auth";
import { handleRoute } from "@/server/core";

export const POST = handleRoute(async () => {
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
});
