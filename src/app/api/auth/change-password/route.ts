import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "@/server/auth";
import { withAuth, BadRequestError } from "@/server/core";
import { changePasswordSchema } from "@/schemas";
import type { AuthResponse } from "@/types";

export const POST = withAuth(async (req: NextRequest) => {
  const body = changePasswordSchema.parse(await req.json());
  const result = await changePassword(body.currentPassword, body.newPassword);

  if (!result.success) {
    throw new BadRequestError(result.error || "Failed to change password");
  }

  return NextResponse.json<AuthResponse>({ success: true });
});
