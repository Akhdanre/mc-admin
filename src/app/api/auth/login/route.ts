import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/server/services/auth";
import type { LoginRequestBody, AuthResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginRequestBody;
    if (!body?.password) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const isValid = await verifyPassword(body.password);
    if (!isValid) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    const res = NextResponse.json<AuthResponse>({ success: true });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: unknown) {
    return NextResponse.json<AuthResponse>(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
