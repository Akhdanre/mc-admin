import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/server/services/auth";
import type { AuthSessionResponse } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = verifySessionToken(token);

  return NextResponse.json<AuthSessionResponse>({
    authenticated,
    username: authenticated ? "admin" : undefined,
  });
}
