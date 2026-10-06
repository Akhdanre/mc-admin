import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, changePassword, SESSION_COOKIE_NAME } from "@/server/services/auth";
import type { ChangePasswordRequestBody, AuthResponse } from "@/types";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json<AuthResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ChangePasswordRequestBody;
    if (!body?.currentPassword || !body?.newPassword) {
      return NextResponse.json<AuthResponse>(
        { success: false, error: "Current and new password are required" },
        { status: 400 }
      );
    }

    const result = await changePassword(body.currentPassword, body.newPassword);
    if (!result.success) {
      return NextResponse.json<AuthResponse>({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json<AuthResponse>({ success: true });
  } catch (err: unknown) {
    return NextResponse.json<AuthResponse>(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
